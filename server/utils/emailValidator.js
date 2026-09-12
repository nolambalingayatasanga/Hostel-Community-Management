const dns = require('dns').promises;
const net = require('net');
const User = require('../models/User');

// Common temporary / disposable email providers to block immediately
const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'guerrillamailblock.com',
  'mailinator.com',
  'yopmail.com',
  'throwawaymail.com',
  'temp-mail.org',
  'fakeinbox.com',
  'dispostable.com',
  'trashmail.com',
  'sharklasers.com',
  'getairmail.com',
  'mohmal.com',
  'maildrop.cc',
  'inboxkitten.com',
  'mytemp.email',
  'nada.ltd',
  'crazymailing.com'
]);

// Standard email syntax validator (RFC 5322)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Perform deep SMTP mailbox deliverability check
 */
async function checkSmtpMailbox(email, mxHost) {
  return new Promise((resolve) => {
    let socket;
    let finished = false;
    let step = 0;

    const finish = (result) => {
      if (finished) return;
      finished = true;
      try {
        if (socket && !socket.destroyed) {
          socket.write('QUIT\r\n');
          socket.destroy();
        }
      } catch {}
      resolve(result);
    };

    try {
      socket = net.createConnection(25, mxHost);
      socket.setTimeout(4000); // 4 seconds timeout
    } catch {
      return resolve({ status: 'UNKNOWN', message: 'Try with different account' });
    }

    socket.on('data', (data) => {
      const msg = data.toString();
      const code = parseInt(msg.slice(0, 3), 10);

      // Step 0: Server 220 greeting banner
      if (step === 0 && code === 220) {
        step = 1;
        socket.write('HELO mail.community.org\r\n');
      }
      // Step 1: HELO acknowledged -> MAIL FROM
      else if (step === 1 && code === 250) {
        step = 2;
        socket.write('MAIL FROM:<verify@community.org>\r\n');
      }
      // Step 2: Sender accepted -> RCPT TO (the target email to verify)
      else if (step === 2 && code === 250) {
        step = 3;
        socket.write(`RCPT TO:<${email}>\r\n`);
      }
      // Step 3: Recipient verification result
      else if (step === 3) {
        const text = msg.toLowerCase();

        // 250: Mailbox exists and is ready to receive
        if (code === 250) {
          finish({ status: 'EXISTS', message: 'Continue' });
        }
        // 550 - 554: Mailbox rejected or domain error
        else if (code >= 550 && code <= 554) {
          // Check for IP blacklists / Spamhaus / policy blocks -> UNKNOWN
          if (
            text.includes('blocked') ||
            text.includes('spamhaus') ||
            text.includes('service unavailable') ||
            text.includes('denied') ||
            text.includes('blacklist') ||
            text.includes('reputation') ||
            text.includes('policy rejection')
          ) {
            finish({ status: 'UNKNOWN', message: 'Try with different account' });
          } else {
            // Mailbox does not exist (NoSuchUser, invalid mailbox, disabled)
            finish({ status: 'DOES_NOT_EXIST', message: "Email doesn't exist" });
          }
        }
        // 4xx: Greylisted or temporary rate limiting -> UNKNOWN
        else if (code >= 400 && code < 500) {
          finish({ status: 'UNKNOWN', message: 'Try with different account' });
        }
        // Any other unrecognized code
        else {
          finish({ status: 'UNKNOWN', message: 'Try with different account' });
        }
      }
    });

    socket.on('error', () => {
      finish({ status: 'UNKNOWN', message: 'Try with different account' });
    });

    socket.on('timeout', () => {
      finish({ status: 'UNKNOWN', message: 'Try with different account' });
    });
  });
}

/**
 * Verify email deliverability & existence
 * Returns: { status: 'EXISTS' | 'DOES_NOT_EXIST' | 'UNKNOWN' | 'ALREADY_REGISTERED', message: string }
 */
async function verifyEmailDeliverability(rawEmail) {
  if (!rawEmail || typeof rawEmail !== 'string') {
    return { status: 'DOES_NOT_EXIST', message: "Email doesn't exist" };
  }

  const email = rawEmail.trim().toLowerCase();

  // 1. Basic format & RFC 5322 syntax validation
  if (!EMAIL_REGEX.test(email)) {
    return { status: 'DOES_NOT_EXIST', message: "Email doesn't exist" };
  }

  const [user, domain] = email.split('@');
  if (!user || !domain || domain.indexOf('.') === -1) {
    return { status: 'DOES_NOT_EXIST', message: "Email doesn't exist" };
  }

  // 2. Disposable / temporary email check
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { status: 'DOES_NOT_EXIST', message: "Email doesn't exist" };
  }

  // 3. Database uniqueness check (Already registered users)
  try {
    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return {
        status: 'ALREADY_REGISTERED',
        message: 'This email is already registered. Please log in.'
      };
    }
  } catch (err) {
    console.error('Error checking existing user for email validation:', err);
  }

  // 4. DNS MX record resolution
  let mxRecords = [];
  try {
    mxRecords = await dns.resolveMx(domain);
  } catch (err) {
    // If MX lookup failed, check if the domain has an A record (fallback for direct mail hosts)
    try {
      const aRecords = await dns.resolve4(domain);
      if (!aRecords || aRecords.length === 0) {
        return { status: 'DOES_NOT_EXIST', message: "Email doesn't exist" };
      }
      mxRecords = [{ exchange: domain, priority: 10 }];
    } catch {
      // Domain does not exist in DNS
      return { status: 'DOES_NOT_EXIST', message: "Email doesn't exist" };
    }
  }

  if (!mxRecords || mxRecords.length === 0) {
    return { status: 'DOES_NOT_EXIST', message: "Email doesn't exist" };
  }

  // 5. Deep SMTP handshake check
  const sortedMx = mxRecords.sort((a, b) => a.priority - b.priority);
  const primaryMx = sortedMx[0].exchange;

  try {
    return await checkSmtpMailbox(email, primaryMx);
  } catch {
    return { status: 'UNKNOWN', message: 'Try with different account' };
  }
}

module.exports = {
  verifyEmailDeliverability
};
