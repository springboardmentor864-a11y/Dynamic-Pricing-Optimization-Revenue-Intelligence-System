export const addActivityLog = (title, description, iconType) => {
  try {
    const savedLogs = JSON.parse(localStorage.getItem("activity_logs") || "[]");
    const newLog = {
      id: Date.now(),
      title,
      description,
      iconType, // 'plus' | 'edit' | 'trash' | 'brain' | 'download' | 'login'
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " today"
    };
    localStorage.setItem("activity_logs", JSON.stringify([newLog, ...savedLogs]));
  } catch (e) {
    console.error("Failed to log activity", e);
  }
};
