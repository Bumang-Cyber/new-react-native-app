// 날짜 유틸리티 함수들

const isSameDay = (date1: Date, date2: Date) => {
  return date1.toDateString() === date2.toDateString();
};

const isToday = (date: Date) => {
  return isSameDay(date, new Date());
};

const isCurrentMonth = (date: Date, currentDate: Date) => {
  return date.getMonth() === currentDate.getMonth();
};

export { isSameDay, isToday, isCurrentMonth };
