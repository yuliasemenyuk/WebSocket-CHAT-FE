import { format, isToday, differenceInDays } from 'date-fns'; 

export function formatMessageDate(timestamp: number): string {
    const messageDate = new Date(timestamp);
    if (isToday(messageDate)) {
      return `Today ${format(messageDate, 'HH:mm')}`;
    } else {
      const daysAgo = differenceInDays(new Date(), messageDate);
      if (daysAgo === 1) {
        return 'Yesterday';
      } else {
        return `${daysAgo} days ago`;
      }
    }
  }