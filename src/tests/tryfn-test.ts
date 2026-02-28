import * as utils from '~~utils';

async function randomPromise() {
  return await new Promise<string>((res, rej) => {
    if (Math.random() > 0.5) {
      rej('Random > 0.5');
      return;
    }

    return res('OK');
  });
}

utils
  .tryFn(randomPromise, { disableLogOnError: true })
  .then(([error, data]) => {
    if (error) {
      console.log(error);
      return;
    }

    console.log(data);
  });
