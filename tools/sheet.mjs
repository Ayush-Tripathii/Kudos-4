import sharp from 'sharp'; import fs from 'fs'; import path from 'path';
const dir=process.argv[2], pre=process.argv[3], out=process.argv[4];
const files=fs.readdirSync(dir).filter(f=>f.startsWith(pre)).sort();
const W=440,H=440,cols=4,rows=Math.ceil(files.length/cols);
const comps=[];
for(let i=0;i<files.length;i++){
  const buf=await sharp(path.join(dir,files[i])).resize(W,H-30,{fit:'contain',background:'#fff'}).toBuffer();
  const x=(i%cols)*W,y=Math.floor(i/cols)*H;
  comps.push({input:buf,left:x,top:y+30});
  const svg=`<svg width="${W}" height="30"><rect width="100%" height="100%" fill="#000"/><text x="8" y="21" font-size="18" fill="#fff" font-family="Arial">${i+1}. ${files[i]}</text></svg>`;
  comps.push({input:Buffer.from(svg),left:x,top:y});
}
await sharp({create:{width:W*cols,height:H*rows,channels:3,background:'#fff'}}).composite(comps).jpeg({quality:75}).toFile(out);
