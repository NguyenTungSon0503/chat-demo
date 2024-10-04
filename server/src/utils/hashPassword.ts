import bcrypt from 'bcrypt';

const hashPassword = async (password: string) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return hashedPassword;
};

const isMatch = async (plainPassword: string, password: string) => {
  const isMatch = await bcrypt.compare(plainPassword, password);
  return isMatch;
};

export { hashPassword, isMatch };
