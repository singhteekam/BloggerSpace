

const validateUsername = (username) => {
  if (!username || username.length < 3 || username.length > 20) {
    return "Username must be between 3 and 20 characters long.";
  }

  if (/\s/.test(username) || !/^[a-zA-Z0-9]+$/.test(username)) {
    return "Username can only contain letters and numbers.";
  }

  return ""; // Empty string indicates the username is valid
};

module.exports = validateUsername;