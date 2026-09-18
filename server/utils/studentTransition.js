const User = require('../models/User');
const Status = require('../models/Status');
const sendEmail = require('./email');

const resolveClientBaseUrl = (source) => {
  if (typeof source === 'string' && source.trim()) {
    try {
      const parsed = new URL(source);
      return `${parsed.protocol}//${parsed.host}`;
    } catch (_) {
      return source.trim().replace(/\/+$/, '');
    }
  }
  if (source && typeof source === 'object') {
    const raw =
      source.query?.clientUrl ||
      source.query?.redirectUrl ||
      source.query?.origin ||
      source.body?.clientUrl ||
      source.headers?.['x-client-url'] ||
      source.headers?.origin ||
      source.headers?.referer;
    if (raw) {
      try {
        const parsed = new URL(raw);
        return `${parsed.protocol}//${parsed.host}`;
      } catch (_) {
        return String(raw).replace(/\/+$/, '');
      }
    }
    const forwardedHost = source.headers?.['x-forwarded-host'];
    if (forwardedHost) {
      const proto = source.headers?.['x-forwarded-proto'] || source.protocol || 'https';
      return `${proto}://${forwardedHost}`.replace(/\/+$/, '');
    }
    const host = source.get ? source.get('host') : source.headers?.host;
    if (host) {
      const proto = source.protocol || (host.includes('localhost') ? 'http' : 'https');
      return `${proto}://${host}`.replace(/\/+$/, '');
    }
  }
  return (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
};

/**
 * Checks all STUDENT users in the database and transitions them to ALUMNI
 * if their graduation year and month are in the past.
 */
const checkAndTransitionStudents = async (reqOrUrl) => {
  try {
    const baseUrl = resolveClientBaseUrl(reqOrUrl);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-indexed (1 = Jan, 12 = Dec)

    console.log(`[Student Transition] Running auto-transition check for Year: ${currentYear}, Month: ${currentMonth}...`);

    // Find all users who are currently STUDENT
    const students = await User.find({ role: 'STUDENT' });
    let transitionCount = 0;

    // Find the 'Graduated' status ID
    let graduatedStatus = await Status.findOne({ name: /graduated/i });
    if (!graduatedStatus) {
      graduatedStatus = await Status.findOne({});
    }

    for (const student of students) {
      const { endMonth, endYear } = student.education || {};
      if (endYear && endMonth) {
        const isOlder = endYear < currentYear || (endYear === currentYear && endMonth < currentMonth);
        if (isOlder) {
          console.log(`[Student Transition] Transitioning student ${student.name} (${student.email}) to Alumni. Graduated: ${endMonth}/${endYear}`);
          
          student.role = 'ALUMNI';
          if (graduatedStatus) {
            student.status = graduatedStatus._id;
          }
          await student.save();
          transitionCount++;

          // Send email notification
          try {
            const subject = 'Update your career/employment details on Kambi Connect Profile';
            const message = `Hi ${student.name},\n\n` +
              `Congratulations on your graduation! Since your expected graduation date (${endMonth}/${endYear}) has passed, we have updated your profile role to Alumni.\n\n` +
              `Please log in to your account and update your professional details (Job Title, Organization, or Business Details).\n\n` +
              `Best regards,\n` +
              `Kambi Connect Team`;
            
            const html = `<p>Hi ${student.name},</p>` +
              `<p>Congratulations on your graduation! Since your expected graduation date (<strong>${endMonth}/${endYear}</strong>) has passed, we have updated your profile role to <strong>Alumni</strong>.</p>` +
              `<p>Please <a href="${baseUrl}/profile">log in to your profile</a> and update your professional details (Job Title, Organization, or Business Details).</p>` +
              `<br/><p>Best regards,<br/>Kambi Connect Team</p>`;

            await sendEmail({
              email: student.email,
              subject,
              message,
              html
            });
            console.log(`[Student Transition] Sent email to ${student.email}`);
          } catch (emailErr) {
            console.error(`[Student Transition] Failed to send email to ${student.email}:`, emailErr);
          }
        }
      }
    }

    if (transitionCount > 0) {
      console.log(`[Student Transition] Successfully transitioned ${transitionCount} students to Alumni.`);
    } else {
      console.log(`[Student Transition] No students needed transition.`);
    }

    return transitionCount;
  } catch (error) {
    console.error('[Student Transition] Error during transition check:', error);
    return 0;
  }
};

/**
 * Checks a single user record and updates it to ALUMNI if graduation date is past.
 * Returns true if transition occurred, otherwise false.
 */
const checkAndTransitionSingleUser = async (user, reqOrUrl) => {
  try {
    if (user.role !== 'STUDENT' || !user.education?.endYear || !user.education?.endMonth) {
      return false;
    }

    const baseUrl = resolveClientBaseUrl(reqOrUrl);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const { endMonth, endYear } = user.education;
    const isOlder = endYear < currentYear || (endYear === currentYear && endMonth < currentMonth);

    if (isOlder) {
      user.role = 'ALUMNI';
      
      const graduatedStatus = await Status.findOne({ name: /graduated/i });
      if (graduatedStatus) {
        user.status = graduatedStatus._id;
      }
      
      // send email
      try {
        const subject = 'Update your career/employment details on Hostel Community';
        const message = `Hi ${user.name},\n\n` +
          `Congratulations on your graduation! Since your expected graduation date (${endMonth}/${endYear}) has passed, we have updated your profile role to Alumni.\n\n` +
          `Please log in to your account and update your professional details (Job Title, Organization, or Business Details).\n\n` +
          `Best regards,\n` +
          `Hostel Community Team`;
        
        const html = `<p>Hi ${user.name},</p>` +
          `<p>Congratulations on your graduation! Since your expected graduation date (<strong>${endMonth}/${endYear}</strong>) has passed, we have updated your profile role to <strong>Alumni</strong>.</p>` +
          `<p>Please <a href="${baseUrl}/profile">log in to your profile</a> and update your professional details (Job Title, Organization, or Business Details).</p>` +
          `<br/><p>Best regards,<br/>Hostel Community Team</p>`;

        await sendEmail({
          email: user.email,
          subject,
          message,
          html
        });
        console.log(`[Student Transition] Sent email to ${user.email} (on-demand transition)`);
      } catch (emailErr) {
        console.error(`[Student Transition] Failed to send email to ${user.email}:`, emailErr);
      }
      return true;
    }
    return false;
  } catch (err) {
    console.error('[Student Transition] Error during single transition check:', err);
    return false;
  }
};

module.exports = {
  checkAndTransitionStudents,
  checkAndTransitionSingleUser
};
