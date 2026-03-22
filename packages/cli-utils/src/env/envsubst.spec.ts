import { Envsubst } from "./envsubst.js";

const envsubst = new Envsubst();
const original1 = `~/Documents/$USER-blog`;
const resolved1 = envsubst.subst(original1);
console.log(original1, "=>", resolved1);
