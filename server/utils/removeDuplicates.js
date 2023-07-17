const removeDuplicates = (array, property) => {
  const lookup = {};

  return array.filter((item) => {
    const key = item[property];

    if (!lookup[key]) {
      lookup[key] = true;
      return true;
    }

    return false;
  }); 
};

module.exports = removeDuplicates;