import { format, isToday, differenceInDays } from 'date-fns'; 

export function formatMessageDate(timestamp: number): string {
    const messageDate = new Date(timestamp);
    if (isToday(messageDate)) {
      return `Today ${format(messageDate, 'HH:mm')}`;
    } else {
      const daysAgo = differenceInDays(new Date(), messageDate);
      if (!isToday(messageDate) && daysAgo >= 0 && daysAgo <= 1) {
        return 'Yesterday';
      } else {
        return `${daysAgo} days ago`;
      }
    }
}

export function textNotification(text: string, status: "error" | "success" ) {
  const notificationEl = document.createElement('div');
  notificationEl.classList.add('notification');
  
  const paragraph = document.createElement('p');
  paragraph.textContent = text;
  paragraph.classList.add('notification-text');
  
  notificationEl.appendChild(paragraph);
  
  if (status === "error") {
    notificationEl.classList.add("err-notification");
  }
  
  // Append to body
  document.body.appendChild(notificationEl);
  
  // Force a reflow to ensure the transition works
  notificationEl.offsetHeight;
  
  // Add 'show' class to trigger fade-in
  notificationEl.classList.add('show');
  
  // Set timeout to remove the notification
  setTimeout(() => {
    notificationEl.classList.remove('show');
    
    // Wait for the fade-out transition to complete before removing the element
    setTimeout(() => {
      document.body.removeChild(notificationEl);
    }, 300); // Assumes a 0.3s transition duration
  }, 2000);
}