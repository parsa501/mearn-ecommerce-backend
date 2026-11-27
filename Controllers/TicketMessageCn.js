
import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import TicketMessage from "../Models/TicketMessageMd.js";
import Ticket from "../Models/TicketMd.js";

export const create = catchAsync(async (req, res, next) => {
  const ticket = await Ticket.findById(req.params.ticketId);

  if (!ticket) {
    return next(new HandleERROR("Ticket not found", 404));
  }

  const isAdmin = req.role === "admin" || req.role === "superAdmin";

  if (!isAdmin && ticket.userId.toString() !== req.userId.toString()) {
    return next(new HandleERROR("You are not authorized", 403));
  }

  if (ticket.status === "closed") {
    return next(new HandleERROR("This ticket is closed", 400));
  }

  const ticketMessage = await TicketMessage.create({
    ticketId: ticket._id,
    senderId: req.userId,
    senderRole: isAdmin ? req.role : "user",
    message: req.body.message,
  });

  ticket.status = isAdmin ? "answered" : "inProgress";

  await ticket.save();

  return res.status(201).json({
    success: true,
    data: ticketMessage,
  });
});

export const getAll = catchAsync(async (req, res, next) => {
  const ticket = await Ticket.findById(req.params.ticketId);

  if (!ticket) {
    return next(new HandleERROR("Ticket not found", 404));
  }

  const isAdmin = req.role === "admin" || req.role === "superAdmin";

  if (!isAdmin && ticket.userId.toString() !== req.userId.toString()) {
    return next(new HandleERROR("You are not authorized", 403));
  }

  const features = new ApiFeatures(
    TicketMessage,
    req.query,
    req.role,
  )
    .addManualFilters({ ticketId: ticket._id })
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate();

  const result = await features.execute();

  return res.status(200).json({
    success: true,
    result: result.length,
    data: result,
  });
});
