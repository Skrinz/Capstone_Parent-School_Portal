const prisma = require('../config/database');
const { uploadFile, replaceFile } = require("../utils/supabaseStorage");

const eventsService = {
  async getAllEvents({ page, limit }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        skip,
        take,
        include: {
          user: {
            select: {
              user_id: true,
              fname: true,
              lname: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      }),
      prisma.event.count()
    ]);

    return {
      events,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  },

  async getEventById(eventId) {
    const event = await prisma.event.findUnique({
      where: { event_id: eventId },
      include: {
        user: {
          select: {
            user_id: true,
            fname: true,
            lname: true
          }
        }
      }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    return event;
  },

  async createEvent(eventData) {
    const { event_title, event_desc, event_date, created_by, file, photo_path } = eventData;

    // Check if creator exists
    const creator = await prisma.user.findUnique({
      where: { user_id: created_by }
    });
    if (!creator) {
      throw new Error('User not found');
    }

    const resolvedPhotoPath = file
      ? await uploadFile(file, "events")
      : photo_path;

    if (!resolvedPhotoPath) {
      throw new Error("Event photo is required");
    }

    const event = await prisma.event.create({
      data: {
        event_title,
        event_desc,
        event_date: event_date ? new Date(event_date) : new Date(),
        created_by,
        photo_path: resolvedPhotoPath
      },
      include: {
        user: {
          select: {
            user_id: true,
            fname: true,
            lname: true
          }
        }
      }
    });

    return event;
  },

  async updateEvent(eventId, updateData) {
    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { event_id: eventId }
    });
    if (!existingEvent) {
      throw new Error('Event not found');
    }

    const { file, ...restUpdateData } = updateData;

    if (file) {
      restUpdateData.photo_path = await replaceFile(
        file,
        existingEvent.photo_path,
        "events",
        "events.service",
      );
    }

    if (restUpdateData.event_date) {
      restUpdateData.event_date = new Date(restUpdateData.event_date);
    }

    const event = await prisma.event.update({
      where: { event_id: eventId },
      data: restUpdateData,
      include: {
        user: {
          select: {
            user_id: true,
            fname: true,
            lname: true
          }
        }
      }
    });
    return event;
  },

  async deleteEvent(eventId) {
    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { event_id: eventId }
    });
    if (!existingEvent) {
      throw new Error('Event not found');
    }

    await prisma.event.delete({
      where: { event_id: eventId }
    });

    return true;
  }
};

module.exports = eventsService;
