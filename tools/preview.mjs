import sharp from 'sharp'; import fs from 'fs'; import path from 'path';
const src = process.argv[2], out = process.argv[3]; fs.mkdirSync(out,{recursive:true});
for (const d of ['dish','prop']) for (const f of fs.readdirSync(path.join(src,d))) {
  const i = sharp(path.join(src,d,f)).rotate(); const m = await i.metadata();
  await i.resize(700,700,{fit:'inside'}).jpeg({quality:70}).toFile(path.join(out,d+'_'+f));
  console.log(d,f,m.width+'x'+m.height,'orient',m.orientation);
}
