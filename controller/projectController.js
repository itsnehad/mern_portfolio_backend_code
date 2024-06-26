import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Project } from "../models/projectSchema.js";
import { v2 as cloudinary } from "cloudinary";

export const addNewProject = catchAsyncErrors(async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Project Banner Image Required!"));
  }
  const { projectBanner } = req.files;
  const {
    title,
    description,
    gitRipoLink,
    projectLink,
    technologies,
    stack,
    deployed,
  } = req.body;

  if (
    !title ||
    !description ||
    !gitRipoLink ||
    !projectLink ||
    !technologies ||
    !stack ||
    !deployed
  ) {
    return next(new ErrorHandler("Please Provide All details!", 400));
  }
  const cloudinaryResponse = await cloudinary.uploader.upload(
    projectBanner.tempFilePath,
    { folder: "PROJECT IMAGE" }
  );
  if (!cloudinaryResponse || cloudinaryResponse.error) {
    console.error(
      "Cloudinary Error:",
      cloudinaryResponse.error || "unknown cloudinary error"
    );
    return next(
      new ErrorHandler("Failed to Upload ProjectBanner to cloudinary", 500)
    );
  }
  const project = await Project.create({
    title,
    description,
    gitRipoLink,
    projectLink,
    technologies,
    stack,
    deployed,
    projectBanner: {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    },
  });
  res.status(201).json({
    success: true,
    message: "New project Added!",
    project,
  });
});

export const deleteProject = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const project = await Project.findById(id);
  if (!project) {
    return next(new ErrorHandler("Project Not Found!!", 404));
  }
  await project.deleteOne();
  res.status(200).json({
    success: true,
    message: "Project deleted!!",
  });
});

export const updateProject = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  // New project data
  const newProjectData = {
    title: req.body.title,
    description: req.body.description,
    gitRipoLink: req.body.gitRipoLink,
    projectLink: req.body.projectLink,
    technologies: req.body.technologies,
    stack: req.body.stack,
    deployed: req.body.deployed,
  };

  if (req.files && req.files.projectBanner) {
    const projectBanner = req.files.projectBanner;
    
    // Fetch the project
    const project = await Project.findById(id);
    if (!project) {
      return next(new ErrorHandler("Project Not Found!", 404));
    }

    // Delete the existing banner if it exists
    if (project.projectBanner && project.projectBanner.public_id) {
      const projectBannerId = project.projectBanner.public_id;
      await cloudinary.uploader.destroy(projectBannerId);
    }

    // Upload new banner
    const cloudinaryResponse = await cloudinary.uploader.upload(
      projectBanner.tempFilePath,
      { folder: "PROJECT IMAGE" }
    );

    newProjectData.projectBanner = {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    };
  }
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    newProjectData,
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );
  res.status(200).json({
    success: true,
    message: "Project Upadated",
    project,
  });
});
export const getAllProject = catchAsyncErrors(async (req, res, next) => {
  const projects =await Project.find();
  res.status(200).json({
    success:true,
    projects,
  })
});
export const getSingleProject = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const project = await Project.findById(id);
  if (!project) {
    return next(new ErrorHandler("Project Not Found!!", 404));
  }
  res.status(200).json({
    success: true,
    project,
  });
});
