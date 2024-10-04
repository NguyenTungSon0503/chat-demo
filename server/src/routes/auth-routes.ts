import express, { Router } from 'express';
import prisma from '../third-party/prisma';
import { hashPassword, isMatch } from '../utils/hashPassword';
import { generateAccessToken } from '../utils/jwt';

const router: Router = express.Router();
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: { username, password: hashedPassword },
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Could not register user' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findFirst({
      where: { username },
    });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isPasswordMatch = isMatch(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const accessToken = await generateAccessToken(user.username);
    return res.status(200).send({
      id: user.id,
      accessToken: accessToken,
    });
  } catch (error) {
    res.status(500).json({ error: 'Could not log in' });
  }
});

export default router;
