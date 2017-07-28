export const ticketNotRegisteredTitle = "Ticket Not Found";
export function ticketNotRegisteredMessage(ticketNumber) { return `The ticket ${ticketNumber} was not found for the selected field and produciton date.`; }

export const ticketNotRegisteredToFieldTitle = "Ticket Not Registered to Field";
export function ticketNotRegisteredToFieldMessage(ticketNumber, validField, invalidField) { return `The ticket ${ticketNumber} is was assigned to field <strong>${validField}</strong> but scanned at <strong>${invalidField}</strong>.` }

export const ticketNotRegisteredToDateTitle = "Ticket invalid for Production Date";
export function ticketNotRegisteredToDateMessage(ticketNumber, validDate, invalidDate) { return `The ticket #${ticketNumber} is was assigned for production on <strong>${validDate}</strong> but scanned at <strong>${invalidDate}</strong>.` }

export const ticketAlreadyProcessedWarningTitle = "Ticket already scanned";
export function ticketAlreadyProcessedWarningMessage(ticketNum) {
  return `The ticket <strong>${ticketNum}</strong> has already been scanned for this employee.`
}

export const ticketAlreadyProcessedCriticalTitle = "WARNING: Ticket already scanned";
export function ticketAlreadyProcessedCriticalMessage(ticketNum, employeeName, toteNum) {
  return `The ticket <strong>${ticketNum}</strong> has already been processed for <strong>${employeeName}</strong> on tote <strong>${toteNum}</strong>. Please notify supervisor about possible fraudulent activity.`
}

export const toteAlreadyScannedWarningTitle = "Tote already scanned";
export function toteAlreadyScannedWarningMessage(toteNumber) { return `The tote <strong>${toteNumber}</strong> has already been recorded for this employee.`; }

export const toteAlreadyScannedCriticalTitle = "WARNING: Tote scanned for another employee";
export function toteAlreadyScannedCriticalMessage(toteNumber, employeeName, ticketNum) {
  return `The tote <strong>${toteNumber}</strong> has already been recorded for <strong>${employeeName}</strong> on ticket number <strong>${ticketNum}</strong>. Please notify supervisor about possible fraudulent activity.`;
}