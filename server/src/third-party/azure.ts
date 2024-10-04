import {
  BlobSASPermissions,
  BlobServiceClient,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import config from '../config/config';

const { AZURE_STORAGE_ACCOUNT_NAME, AZURE_STORAGE_ACCOUNT_KEY } = config.env;

if (!AZURE_STORAGE_ACCOUNT_NAME || !AZURE_STORAGE_ACCOUNT_KEY) {
  throw new Error('Azure Storage Account name and key are required');
}

const sharedKeyCredential = new StorageSharedKeyCredential(
  AZURE_STORAGE_ACCOUNT_NAME,
  AZURE_STORAGE_ACCOUNT_KEY,
);

const blobServiceClient = new BlobServiceClient(
  `https://${AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
  sharedKeyCredential,
);

const createContainer = async (containerName: string) => {
  const containerClient = blobServiceClient.getContainerClient(containerName);

  const exists = await containerClient.exists();
  if (!exists) {
    await containerClient.createIfNotExists();
  }

  return containerClient;
};

const generateSASTokenWithUrl = async (
  containerName: string,
  blobName: string,
  permission: string,
): Promise<string> => {
  const containerClient = await createContainer(containerName);
  const blobClient = containerClient.getBlockBlobClient(blobName);

  const sasOptions = {
    containerName,
    blobName,
    startsOn: new Date(),
    permissions: BlobSASPermissions.parse(permission),
    expiresOn: new Date(new Date().valueOf() + 5 * 60 * 1000), // Expire in 5 minutes
  };

  try {
    const sasToken = generateBlobSASQueryParameters(
      sasOptions,
      sharedKeyCredential,
    ).toString();
    return `${blobClient.url}?${sasToken}`;
  } catch (error) {
    console.error('Error generating SAS token:', error);
    throw new Error('Failed to generate SAS token');
  }
};

export { generateSASTokenWithUrl };
