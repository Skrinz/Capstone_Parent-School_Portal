const prisma = require('../config/database');

const announcementsService = {
  async getAllAnnouncements({ page, limit, type, userRoles }) {
    // Validate pagination params
    if (!page || isNaN(parseInt(page)) || parseInt(page) < 1) {
      throw new Error('Invalid page number');
    }
    if (!limit || isNaN(parseInt(limit)) || parseInt(limit) < 1) {
      throw new Error('Invalid limit number');
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};

    if (type) {
      // Must match Prisma AnnouncementType enum and route validators
      const validTypes = ['General', 'Staff_only', 'Memorandum'];
      if (!validTypes.includes(type)) {
        throw new Error(`Invalid announcement type. Must be one of: ${validTypes.join(', ')}`);
      }
      where.announcement_type = type;
    } else {
      const isStaff = userRoles.some(role =>
        ['Teacher', 'Admin', 'Principal', 'Vice_Principal', 'Librarian'].includes(role)
      );

      if (!isStaff) {
        where.announcement_type = 'General';
      }
    }

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        skip,
        take,
        include: {
          user: {
            select: {
              user_id: true,
              fname: true,
              lname: true,
              photo_path: true
            }
          },
          files: {
            include: {
              file: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      }),
      prisma.announcement.count({ where })
    ]);

    return {
      announcements,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  },

  async getAnnouncementById(announcementId) {
    if (!announcementId) {
      throw new Error('Announcement ID is required');
    }

    const announcement = await prisma.announcement.findUnique({
      where: { announcement_id: announcementId },
      include: {
        user: {
          select: {
            user_id: true,
            fname: true,
            lname: true,
            photo_path: true
          }
        },
        files: {
          include: {
            file: true
          }
        }
      }
    });

    if (!announcement) {
      throw new Error('Announcement not found');
    }

    return announcement;
  },

  async createAnnouncement(announcementData) {
    const { announcement_title, announcement_desc, announcement_type, announced_by, file_ids } = announcementData;

    // Validate required fields
    if (!announcement_title || announcement_title.trim() === '') {
      throw new Error('Announcement title is required');
    }
    if (!announcement_desc || announcement_desc.trim() === '') {
      throw new Error('Announcement description is required');
    }
    if (!announcement_type) {
      throw new Error('Announcement type is required');
    }
    if (!announced_by) {
      throw new Error('Announcer is required');
    }

    // Validate that the announcing user exists
    const announcer = await prisma.user.findUnique({
      where: { user_id: announced_by }
    });
    if (!announcer) {
      throw new Error('Announcing user not found');
    }

    // Validate that all provided file IDs exist
    if (file_ids && file_ids.length > 0) {
      const existingFiles = await prisma.file.findMany({
        where: { file_id: { in: file_ids } }
      });
      if (existingFiles.length !== file_ids.length) {
        throw new Error('One or more provided file IDs do not exist');
      }
    }

    const announcement = await prisma.announcement.create({
      data: {
        announcement_title,
        announcement_desc,
        announcement_type,
        announced_by,
        files: file_ids ? {
          create: file_ids.map(fileId => ({
            file_id: fileId
          }))
        } : undefined
      },
      include: {
        user: {
          select: {
            user_id: true,
            fname: true,
            lname: true,
            photo_path: true
          }
        },
        files: {
          include: {
            file: true
          }
        }
      }
    });

    return announcement;
  },

  async updateAnnouncement(announcementId, updateData) {
    if (!announcementId) {
      throw new Error('Announcement ID is required');
    }

    // Check if announcement exists before updating
    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { announcement_id: announcementId }
    });
    if (!existingAnnouncement) {
      throw new Error('Announcement not found');
    }

    // Validate update fields if provided
    if (updateData.announcement_title !== undefined && updateData.announcement_title.trim() === '') {
      throw new Error('Announcement title cannot be empty');
    }
    if (updateData.announcement_desc !== undefined && updateData.announcement_desc.trim() === '') {
      throw new Error('Announcement description cannot be empty');
    }

    const announcement = await prisma.announcement.update({
      where: { announcement_id: announcementId },
      data: updateData,
      include: {
        user: {
          select: {
            user_id: true,
            fname: true,
            lname: true,
            photo_path: true
          }
        },
        files: {
          include: {
            file: true
          }
        }
      }
    });

    return announcement;
  },

  async deleteAnnouncement(announcementId) {
    if (!announcementId) {
      throw new Error('Announcement ID is required');
    }

    // Check if announcement exists before deleting
    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { announcement_id: announcementId }
    });
    if (!existingAnnouncement) {
      throw new Error('Announcement not found');
    }

    await prisma.announcement.delete({
      where: { announcement_id: announcementId }
    });

    return true;
  }
};

module.exports = announcementsService;