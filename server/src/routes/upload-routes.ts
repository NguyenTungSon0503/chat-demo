import express, { Router } from 'express';
import { generateSASTokenWithUrl } from '../third-party/azure';

const router: Router = express.Router();
router.get('/generate-sas', async (req, res) => {
  const { roomName, blobName } = req.query;
  if (!roomName) {
    return res
      .status(400)
      .json({ error: 'Blob name and room name are required' });
  }
  const url = await generateSASTokenWithUrl(
    roomName as string,
    blobName as string,
    'w',
  );
  res.json({ url: url });
});

export default router;
