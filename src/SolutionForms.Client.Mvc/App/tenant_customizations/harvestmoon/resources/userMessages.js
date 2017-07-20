export const ticketNotRegisteredTitle = "Ticket Not Found";
export function ticketNotRegisteredMessage(ticketNumber) { return `The ticket ${ticketNumber} was not found for the selected field and produciton date.`; }

export const ticketNotRegisteredToFieldTitle = "Ticket Not Registered to Field";
export function ticketNotRegisteredToFieldMessage(ticketNumber, validField, invalidField) { return `The ticket ${ticketNumber} is was assigned to field <strong>${validField}</strong> but scanned at <strong>${invalidField}</strong>.` }

export const ticketNotRegisteredToDateTitle = "Ticket Not Registered for Date";
export function ticketNotRegisteredToDateMessage(ticketNumber, validDate, invalidDate) { return `The ticket ${ticketNumber} is was assigned for production on <strong>${validDate}</strong> but scanned at <strong>${invalidDate}</strong>.` }
