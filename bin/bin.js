#!/usr/bin/env node

let program = require("commander");
let { version } = require("../package.json");
let { getVideoSearch, getShow, getVideo, downloadVideo } = require("./util");

let filters = [];

program
  .version(version)
  .option(
    "--api-key <key>",
    "required: individual API key for the Giant Bomb API"
  )
  .option(
    "--show-regex <string>",
    "required: search shows for first show title that matches regex"
  )
  .option(
    "--video-number <number>",
    "video number to download (most recent = 0)",
    0
  )
  .option(
    "--video-regex <string>",
    "search show for first video name that matches regex"
  )
  .option("--only-premium", "show only premium versions")
  .option("--only-free", "show only free versions")
  .option(
    "--quality <highest/hd/high/low/mobile>",
    "video quality to download",
    "highest"
  )
  .option("--out-dir <path>", "specify output directory", "./")
  .option("--info", "show selected video info instead of downloading")
  .option("--clean", "ignore previous cache results for query")
  .option("--debug", "show debug statements")
  .parse(process.argv);

if (!program.apiKey) {
  console.error("--api-key not provided");
  process.exit(1);
} else if (!program.showRegex) {
  console.error("--show-regex not provided");
  process.exit(1);
} else if (!program.videoRegex && !program.videoNumber) {
  console.error("--video-regex or --video-number must be provided");
  process.exit(1);
}

if (program.onlyPremium) {
  filters.push("premium:true");
} else if (program.onlyFree) {
  filters.push("premium:false");
}

let main = async () => {
  let searchResult = null;

  if (program.showRegex && program.videoRegex) {
    searchResult = await getVideoSearch({
      apiKey: program.apiKey,
      videoRegexString: program.videoRegex,
      showRegexString: program.showRegex,
      clean: program.clean,
      debug: program.debug
    });
  }

  if (searchResult) {
    await downloadVideo({
      video: searchResult,
      apiKey: program.apiKey,
      outDir: program.outDir,
      quality: program.quality,
      debug: program.debug
    });

    return;
  }

  let show = await getShow({
    apiKey: program.apiKey,
    regexString: program.showRegex,
    clean: program.clean,
    debug: program.debug
  });

  if (!show) {
    console.error("no show found for query");
    process.exit(1);
  }

  filters.push(`video_show:${show.id}`);

  const video = await getVideo({
    filters,
    apiKey: program.apiKey,
    regexString: program.videoRegex,
    videoNumber: program.videoNumber,
    clean: program.clean,
    debug: program.debug
  });

  if (!video) {
    console.error("no video found for query");
    process.exit(1);
  }

  if (program.info) {
    console.log(video);
    return;
  }

  await downloadVideo({
    video,
    apiKey: program.apiKey,
    outDir: program.outDir,
    quality: program.quality,
    debug: program.debug
  });
};

main();
