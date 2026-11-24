import sharp from 'sharp'; import path from 'path';
const [dir,out,...files]=process.argv.slice(2);
const W=880,H=620,cols=2,rows=Math.ceil(files.length/cols),comps=[];
for(let i=0;i<files.length;i++){const buf=await sharp(path.join(dir,files[i])).resize(W,H-30,{fit:'cover'}).toBuffer();
const x=(i%cols)*W,y=Math.floor(i/cols)*H;comps.push({input:buf,left:x,top:y+30});
comps.push({input:Buffer.from(`<svg width="${W}" height="30"><rect width="100%" height="100%"/><text x="8" y="21" font-size="18" fill="#fff" font-family="Arial">${files[i]}</text></svg>`),left:x,top:y});}
await sharp({create:{width:W*cols,height:H*rows,channels:3,background:'#fff'}}).composite(comps).jpeg({quality:72}).toFile(out);
