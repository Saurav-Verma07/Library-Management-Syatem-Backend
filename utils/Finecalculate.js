export const calculateFine = (dueDate) => {
  const finePerHour = 0.1; // fine per hour 10 cent
  const today = new Date();
  //const due = new Date(dueDate);

  if (today > dueDate) {
    const lateHours = Math.ceil((today - dueDate) / (1000 * 60 * 60));
    const fine = lateHours * finePerHour;
    //return Number(fine.toFixed(2));
    return fine
  }

  return 0;
};
