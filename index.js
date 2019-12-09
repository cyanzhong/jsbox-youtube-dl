const fs = require("fs");
const ytdl = require("ytdl-core");
const sanitize = require("sanitize-filename");

const l10n = require("l10n");
const input = require("input");
const ui = require("ui");
const quicklook = require("quicklook");
const clipboard = require("clipboard");
const detector = require("detector");

function download(url) {
  ui.toast(url);
  let progress = 0;
  let filename = null;

  const options = {
    filter: format => {
      return format.container == "mp4";
    }
  }

  const onInfo = info => {
    const title = info.player_response.videoDetails.title;
    console.log(title);
    filename = `${sanitize(title)}.mp4`;
  }

  const onProgress = (chunk, downloaded, total) => {
    const ratio = downloaded / total;
    const percent = Math.floor(ratio * 100);
    if (percent != progress) {
      ui.showProgress(ratio, l10n("DOWNLOADING"));
      console.log(`${l10n("DOWNLOADED")}${percent}%`);
    }
    progress = percent;
  }

  const onFinish = () => {
    ui.hideProgress();
    console.log(l10n("FINISHED_DOWNLOADING"));
    fs.renameSync("tmp.mp4", filename);
    quicklook.file(filename);
  }

  ytdl(url, options)
  .on("info", onInfo)
  .on("progress", onProgress)
  .on("finish", onFinish)
  .pipe(fs.createWriteStream("tmp.mp4"));
};

async function prompt() {
  const text = await input.text({
    placeholder: l10n("ENTER_URL"),
    text: detector.link(clipboard.text())
  });

  if (text == undefined) {
    return;
  }

  const link = detector.link(text);
  if (link) {
    download(link);
  } else {
    console.error(l10n("CANNOT_FIND_URL"));
    setTimeout(prompt, 500);
  }
}

const link = detector.link($context.text || $context.link);
if (link) {
  download(link);
} else {
  prompt();
}