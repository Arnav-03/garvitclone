import { User } from '../payload-types';
import { Access, CollectionConfig } from 'payload/types';

const isAdminOrHasAccessToImages = (): Access => async ({ req }) => {
  const user = req.user as User | undefined;

  if (!user) {
    console.log('No user found');
    return false;
  }
  if (user.role === 'admin') {
    console.log('User is admin');
    return true;
  }

  console.log('User is not admin, checking access for images');
  return {
    user: {
      equals: req.user.id,
    },
  };
};

export const Media: CollectionConfig = {
  slug: 'media',
  hooks: {
    beforeChange: [
      ({ req, data }) => {
        console.log('beforeChange hook triggered', { user: req.user, data });
        return { ...data, user: req.user.id };
      },
    ],
  },
  access: {
    read: async ({ req }) => {
      const referer = req.headers.referer;
      console.log('Read access check', { user: req.user, referer });

      if (!req.user || !referer?.includes('sell')) {
        console.log('Read access granted');
        return true;
      }

      const access = await isAdminOrHasAccessToImages()({ req });
      console.log('Read access result:', access);
      return access;
    },
    delete: isAdminOrHasAccessToImages(),
    update: isAdminOrHasAccessToImages(),
  },
  admin: {
    hidden: ({ user }) => {
      const isHidden = user.role !== 'admin';
      console.log('Admin panel visibility check', { user, isHidden });
      return isHidden;
    },
  },
  upload: {
    staticURL: '/media',
    staticDir: 'media',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 1024,
        position: 'centre',
      },
      {
        name: 'tablet',
        width: 1024,
        height: undefined,
        position: 'centre',
      },
    ],
    mimeTypes: ['image/*'],
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      admin: {
        condition: () => false,
      },
    },
  ],
};
