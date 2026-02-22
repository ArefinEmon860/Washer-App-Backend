import httpStatus from "http-status";
import { Service } from "../model/service.model.js";
import AppError from "../errors/AppError.js";
import catchAsync from "../utils/catch.Async.js";
import sendResponse from "../utils/sendResponse.js";


export const createService = catchAsync(async (req, res) => {
  const providerId = req.user._id;

  if (req.user.role !== "provider") {
    throw new AppError(httpStatus.FORBIDDEN,"Only providers can create services");
  }

  const serviceData = {
    ...req.body,
    provider: providerId,
  };

  const service = await Service.create(serviceData);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Service created successfully",
    data: service,
  });
});


export const getAllServices = catchAsync(async (req, res) => {
  const { serviceType, carSize, minPrice, maxPrice } = req.query;

  const filter = { isActive: true };

  if (serviceType) filter.serviceType = serviceType;
  if (carSize) filter.carSize = carSize;

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const services = await Service.find(filter)
    .populate("provider", "name email")
    .sort({ price: 1 });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Services fetched successfully",
    data: services,
  });
});


export const getMyServices = catchAsync(async (req, res) => {
  const providerId = req.user._id;

  const services = await Service.find({ provider: providerId });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Provider services fetched",
    data: services,
  });
});


export const getSingleService = catchAsync(async (req, res) => {
  const { id } = req.params;

  const service = await Service.findById(id).populate(
    "provider",
    "name email"
  );

  if (!service) {
    throw new AppError(httpStatus.NOT_FOUND, "service not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Service fetched successfully",
    data: service,
  });
});


export const updateService = catchAsync(async (req, res) => {
  const { id } = req.params;

  const service = await Service.findById(id);

  if (!service) {
    throw new AppError(httpStatus.NOT_FOUND,"Service not found");
  }

  if (service.provider.toString() !== req.user._id.toString()) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not allowed to update this service");
  }

  Object.assign(service, req.body);
  await service.save();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Service updated successfully",
    data: service,
  });
});


export const deleteService = catchAsync(async (req, res) => {
  const { id } = req.params;

  const service = await Service.findById(id);

  if (!service) {
    throw new AppError(httpStatus.NOT_FOUND, "Service not found");
  }

  if (service.provider.toString() !== req.user._id.toString()) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not allowed to delete this service");
  }

  service.isActive = false;
  await service.save();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Service deleted successfully",
  });
});
