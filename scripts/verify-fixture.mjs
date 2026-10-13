import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
const file='public/fixtures/application-architecture-metamodel-0.7.0.zip';
const data=readFileSync(file);const digest=createHash('sha256').update(data).digest('hex');
const names=execFileSync('unzip',['-Z1',file],{encoding:'utf8'}).split('\n').filter(Boolean);
const canonical=['metamodel','properties','constraints','viewpoints','notation','provenance','version','guidance'];
for(const name of canonical){if(!names.some(n=>n.endsWith(`/canonical/${name}.yaml`)))throw Error(`Missing: ${name}.yaml`)}
console.log(JSON.stringify({fixture:file,sha256:digest,bytes:data.length,entries:names.length,canonical:canonical.length},null,2));
