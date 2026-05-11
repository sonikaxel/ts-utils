export const useLogger = (prefix?: string) => {
  const time = () => {
    let now = new Date().toLocaleTimeString();

    if (prefix) {
      now += ` ${prefix}`;
    }

    return now;
  };

  return {
    log: (message: any) => console.log(time(), message),
    error: (message: any) => console.error(time(), message),
  };
};
