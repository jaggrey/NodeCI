const Buffer = require('safe-buffer').Buffer;
const Keygrip = require('keygrip');
const keys = require('../../config/keys');
const keygrip = new Keygrip([keys.cookieKey]);

module.exports = (user) => {
  // Create session string using Buffer
  const sessionObject = {
    passport: {
      user: user._id.toString()
    }
  };
  const session = Buffer.from(JSON.stringify(sessionObject)).toString('base64');

  // Create signature using keygrip
  const sig = keygrip.sign('session=' + session);

  return { session, sig };
};
