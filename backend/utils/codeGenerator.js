const db = require('../db');

// Alphabet excluding 0, O, 1, I, L
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
const CODE_LENGTH = 8;

const generateRandomCode = () => {
  let result = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * ALPHABET.length);
    result += ALPHABET[randomIndex];
  }
  return result;
};

const generateUniqueCode = async () => {
  let code;
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    code = generateRandomCode();
    attempts++;

    // Check if the code already exists in the database
    const checkResult = await db.query(
      'SELECT id FROM registrations WHERE unique_code = $1',
      [code]
    );

    if (checkResult.rows.length === 0) {
      isUnique = true;
    }
  }

  if (!isUnique) {
    throw new Error('Could not generate a unique attendance code. Please try again.');
  }

  return code;
};

module.exports = {
  generateUniqueCode,
};
