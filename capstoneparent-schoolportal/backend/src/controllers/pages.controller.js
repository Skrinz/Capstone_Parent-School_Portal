const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { replaceFile } = require("../utils/supabaseStorage");

exports.getContactUs = async (req, res) => {
  try {
    const section = await prisma.pageSection.findFirst({
      where: { content_type: "contact" },
      orderBy: { updated_at: "desc" },
    });
    
    if (!section || !section.content) {
      return res.json({});
    }
    
    res.json(JSON.parse(section.content));
  } catch (error) {
    console.error("Error fetching Contact Us:", error);
    res.status(500).json({ message: "Failed to fetch Contact Us content" });
  }
};

exports.updateContactUs = async (req, res) => {
  try {
    const {
      principalOffice,
      libraryOffice,
      facultyOffice,
      facebookPageLabel,
      facebookPageUrl,
      mapEmbedUrl,
    } = req.body;

    const data = {
      principalOffice,
      libraryOffice,
      facultyOffice,
      facebookPageLabel,
      facebookPageUrl,
      mapEmbedUrl,
    };

    let section = await prisma.pageSection.findFirst({
      where: { content_type: "contact" },
    });

    if (section) {
      section = await prisma.pageSection.update({
        where: { page_id: section.page_id },
        data: {
          content: JSON.stringify(data),
          updated_by: req.user?.user_id || 1
        },
      });
    } else {
      section = await prisma.pageSection.create({
        data: {
          content_type: "contact",
          content: JSON.stringify(data),
          updated_by: req.user?.user_id || 1
        },
      });
    }

    res.json(JSON.parse(section.content));
  } catch (error) {
    console.error("Error updating Contact Us:", error);
    res.status(500).json({ message: "Failed to update Contact Us content" });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const section = await prisma.pageSection.findFirst({
      where: { content_type: "history" },
      orderBy: { updated_at: "desc" },
    });
    
    if (!section || !section.content) {
      return res.json({});
    }

    const payload = JSON.parse(section.content);
    payload.imageUrl = section.file_path || payload.imageUrl;
    payload.imageFileName = section.file_name || payload.imageFileName;
    
    res.json(payload);
  } catch (error) {
    console.error("Error fetching History:", error);
    res.status(500).json({ message: "Failed to fetch History content" });
  }
};

exports.updateHistory = async (req, res) => {
  try {
    const { title, body } = req.body;
    let file = req.file;

    const data = { title, body };

    let section = await prisma.pageSection.findFirst({
      where: { content_type: "history" },
    });

    const updateData = {
      content: JSON.stringify(data),
      updated_by: req.user?.user_id || 1
    };

    if (file) {
      updateData.file_path = await replaceFile(
        file,
        section?.file_path,
        "about_us",
        "pages.controller",
      );
      updateData.file_name = file.originalname;
    }

    if (section) {
      section = await prisma.pageSection.update({
        where: { page_id: section.page_id },
        data: updateData,
      });
    } else {
      section = await prisma.pageSection.create({
        data: {
          content_type: "history",
          ...updateData
        },
      });
    }

    const payload = JSON.parse(section.content);
    payload.imageUrl = section.file_path;
    payload.imageFileName = section.file_name;
    res.json(payload);
  } catch (error) {
    console.error("Error updating History:", error);
    res.status(500).json({ message: "Failed to update History content" });
  }
};

exports.getTransparency = async (req, res) => {
  try {
    const section = await prisma.pageSection.findFirst({
      where: { content_type: "transparency" },
      orderBy: { updated_at: "desc" },
    });
    
    if (!section) {
      return res.json({});
    }

    const payload = {};
    payload.imageUrl = section.file_path;
    payload.fileName = section.file_name;
    
    res.json(payload);
  } catch (error) {
    console.error("Error fetching Transparency:", error);
    res.status(500).json({ message: "Failed to fetch Transparency content" });
  }
};

exports.updateTransparency = async (req, res) => {
  try {
    let file = req.file;

    let section = await prisma.pageSection.findFirst({
      where: { content_type: "transparency" },
    });

    const updateData = {
      updated_by: req.user?.user_id || 1
    };

    if (file) {
      updateData.file_path = await replaceFile(
        file,
        section?.file_path,
        "about_us",
        "pages.controller",
      );
      updateData.file_name = file.originalname;
    }

    if (section) {
      section = await prisma.pageSection.update({
        where: { page_id: section.page_id },
        data: updateData,
      });
    } else {
      section = await prisma.pageSection.create({
        data: {
          content_type: "transparency",
          ...updateData
        },
      });
    }

    res.json({ imageUrl: section.file_path, fileName: section.file_name });
  } catch (error) {
    console.error("Error updating Transparency:", error);
    res.status(500).json({ message: "Failed to update Transparency content" });
  }
};

exports.getSchoolCalendars = async (req, res) => {
  try {
    const sections = await prisma.pageSection.findMany({
      where: { content_type: "school_calendar" },
      orderBy: { start_year: "desc" },
    });
    
    const mapped = sections.map(sec => {
      const data = sec.content ? JSON.parse(sec.content) : {};
      return {
        year: sec.start_year.toString(),
        label: data.label || `${sec.start_year} - ${sec.start_year + 1}`,
        imageUrl: sec.file_path ?? "",
        fileName: sec.file_name ?? "",
      };
    });
    res.json(mapped);
  } catch (error) {
    console.error("Error fetching School Calendars:", error);
    res.status(500).json({ message: "Failed to fetch School Calendars" });
  }
};

exports.updateSchoolCalendar = async (req, res) => {
  try {
    const { year, label } = req.body;
    let file = req.file;
    const start_year = parseInt(year);

    let section = await prisma.pageSection.findFirst({
      where: { content_type: "school_calendar", start_year },
      orderBy: { page_id: "desc" },
    });

    const data = { label };

    const updateData = {
      content: JSON.stringify(data),
      updated_by: req.user?.user_id || 1
    };

    if (file) {
      updateData.file_path = await replaceFile(
        file,
        section?.file_path,
        "about_us",
        "pages.controller",
      );
      updateData.file_name = file.originalname;
    }

    if (section) {
      section = await prisma.pageSection.update({
        where: { page_id: section.page_id },
        data: updateData,
      });
    } else {
       section = await prisma.pageSection.create({
        data: {
          content_type: "school_calendar",
          start_year,
          ...updateData
        },
      });
    }

    res.json({
      year: section.start_year.toString(),
      label: JSON.parse(section.content).label || `${section.start_year} - ${section.start_year + 1}`,
      imageUrl: section.file_path,
      fileName: section.file_name
    });
  } catch (error) {
    console.error("Error updating School Calendar:", error);
    res.status(500).json({ message: "Failed to update School Calendar" });
  }
};

exports.getOrgCharts = async (req, res) => {
  try {
    const charts = await prisma.orgChart.findMany({
      orderBy: { school_year: "desc" },
    });
    
    const mapped = charts.map(chart => ({
      year: chart.school_year.toString(),
      imageUrl: chart.file_path ?? "",
      fileName: chart.file_name ?? "",
      id: chart.chart_id,
      chart_id: chart.chart_id,
    }));
    
    res.json(mapped);
  } catch (error) {
    console.error("Error fetching Org Charts:", error);
    res.status(500).json({ message: "Failed to fetch Org Charts" });
  }
};

exports.updateOrgChart = async (req, res) => {
  try {
    const { year, originalYear, id } = req.body;
    let file = req.file;

    const chart_id = id ? parseInt(id) : null;


    const school_year = parseInt(year);

    // Check if any record already exists with this year.
    // Use chart_id for precise exclusion if we're in edit mode.
    const existing = await prisma.orgChart.findFirst({
      where: {
        school_year: school_year,
        ...(chart_id ? { NOT: { chart_id: chart_id } } : {})
      }
    });

    if (existing) {
      return res.status(400).json({ 
        message: "There is an organizational chart with that year. Please edit the year." 
      });
    }

    // Try to find the existing chart by ID or by the original year
    let chart = null;
    if (chart_id) {
      chart = await prisma.orgChart.findUnique({
        where: { chart_id: chart_id }
      });
    } else if (originalYear) {
      const lookup_year = parseInt(originalYear);
      chart = await prisma.orgChart.findFirst({
        where: { school_year: lookup_year },
        orderBy: { chart_id: "desc" },
      });
    }

    const updateData = {
      school_year, // apply the (possibly changed) year
      uploaded_by: req.user?.user_id || 1,
    };

    if (file) {
      updateData.file_path = await replaceFile(
        file,
        chart?.file_path,
        "about_us",
        "pages.controller",
      );
      updateData.file_name = file.originalname;
    }

    if (chart) {
      chart = await prisma.orgChart.update({
        where: { chart_id: chart.chart_id },
        data: updateData,
      });
    } else {
      chart = await prisma.orgChart.create({
        data: {
          school_year,
          ...updateData,
        },
      });
    }

    res.json({
      year: chart.school_year.toString(),
      imageUrl: chart.file_path,
      fileName: chart.file_name,
      id: chart.chart_id,
    });
  } catch (error) {
    console.error("Error updating Org Chart:", error);
    res.status(500).json({ message: "Failed to update Org Chart" });
  }
};
