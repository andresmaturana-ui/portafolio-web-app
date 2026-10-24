// Transición líquida de ART?ST adaptada a la portada: la pantalla de un proyecto se «derrite» en la del
// siguiente (ruido + separación RGB + colores girando). Cada pantalla se dibuja dentro de su marco
// (celular, navegador o póster) y el marco también se deforma al pasar. Al pasar el dedo o el mouse,
// la pantalla se distorsiona alrededor del puntero.
const VS = "attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;uv.y=1.-uv.y;gl_Position=vec4(p,0,1);}";
const FS = `precision highp float;varying vec2 uv;
uniform sampler2D t0,t1;uniform float prog,time,strength,rad,hover;uniform vec2 res,a0,a1,o0,o1,mouse;uniform vec4 r0,r1;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.;a*=.5;}return v;}
vec3 hue(vec3 c,float a){const vec3 k=vec3(.57735);float ca=cos(a);return c*ca+cross(k,c)*sin(a)+k*dot(k,c)*(1.-ca);}
vec4 samp(sampler2D t,vec2 u,vec4 R,vec2 r,vec2 o,float ab){
 vec2 l=(u-R.xy)/(2.*R.zw)+.5;
 vec2 q=abs(u-R.xy)*res-R.zw*res+rad;float sd=length(max(q,0.))+min(max(q.x,q.y),0.)-rad;
 vec2 c=(l-.5)*r+.5+(o-.5)*(1.-r);
 vec3 col=vec3(texture2D(t,c+vec2(ab,0)).r,texture2D(t,c).g,texture2D(t,c-vec2(ab,0)).b);
 return vec4(col,1.-smoothstep(-1.,1.,sd));}
void main(){
 float w=sin(prog*3.14159);
 vec2 q=uv*3.;float f=fbm(q+vec2(time*.25,-time*.2)+fbm(q*1.7-time*.15));
 vec2 d=vec2(cos(f*6.2831),sin(f*6.2831))*(f-.3)*strength*w;
 float edge=smoothstep(prog-.18,prog+.18,f*.9+uv.y*.1+.05);
 vec2 pm=(uv-mouse)*vec2(res.x/res.y,1.);
 float m=hover*exp(-dot(pm,pm)/.012);
 vec2 dm=vec2(cos(f*6.2831),sin(f*6.2831))*.05*m-pm*.35*m;
 float ab=.025*w*strength/.35+.012*m;
 vec4 c0=samp(t0,uv+d*prog+dm,r0,a0,o0,ab);
 vec4 c1=samp(t1,uv-d*(1.-prog)+dm,r1,a1,o1,ab);
 vec4 c=mix(c1,c0,edge);
 float s=min(1.,strength/.35);
 c.rgb=hue(c.rgb,w*f*5.*s+m*f*2.);
 c.rgb=mix(c.rgb,c.rgb*1.2+vec3(.06,0,.1)*w,w*s);
 gl_FragColor=c;}`;

export type LiquidShot = {
  img: HTMLImageElement;
  /* Marco en px de la pantalla: centro y medio ancho/alto */
  rect: [number, number, number, number];
  /* Parte de la captura que se ve (0 → 1 en x e y) */
  focus: [number, number];
};

export function liquidSupported() {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    return !!document.createElement("canvas").getContext("webgl");
  } catch {
    return false;
  }
}

export function createLiquid(canvas: HTMLCanvasElement, strength: number) {
  const gl = canvas.getContext("webgl", { premultipliedAlpha: false, alpha: true });
  if (!gl) return null;
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U: Record<string, WebGLUniformLocation | null> = {};
  ["t0", "t1", "prog", "time", "strength", "rad", "hover", "res", "mouse", "a0", "a1", "o0", "o1", "r0", "r1"].forEach((k) => {
    U[k] = gl.getUniformLocation(prog, k);
  });
  [0, 1].forEach((unit) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  });
  gl.uniform1i(U.t0, 0);
  gl.uniform1i(U.t1, 1);
  gl.uniform1f(U.strength, strength);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const bound: (HTMLImageElement | null)[] = [null, null];
  let dpr = 1;

  const resize = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.res, canvas.clientWidth, canvas.clientHeight);
    gl.uniform1f(U.rad, 18);
  };

  const use = (unit: 0 | 1, shot: LiquidShot) => {
    const W = canvas.clientWidth || 1;
    const H = canvas.clientHeight || 1;
    const [cx, cy, hw, hh] = shot.rect;
    if (bound[unit] !== shot.img) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      // Si la imagen no permite CORS, esto lanza un error y la portada usa el carrusel.
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, shot.img);
      bound[unit] = shot.img;
    }
    // La captura «cubre» el marco (object-fit: cover).
    const pa = hw / hh;
    const ia = shot.img.naturalWidth / shot.img.naturalHeight;
    gl.uniform4f(unit ? U.r1 : U.r0, cx / W, cy / H, hw / W, hh / H);
    gl.uniform2fv(unit ? U.a1 : U.a0, pa > ia ? [1, ia / pa] : [pa / ia, 1]);
    gl.uniform2fv(unit ? U.o1 : U.o0, shot.focus);
  };

  // mouse: posición del puntero en px dentro del lienzo; hover: 0 (quieto) → 1 (moviéndose).
  const draw = (a: LiquidShot, b: LiquidShot, p: number, time: number, mouse: [number, number], hover: number) => {
    use(0, a);
    use(1, b);
    gl.uniform2f(U.mouse, mouse[0] / (canvas.clientWidth || 1), mouse[1] / (canvas.clientHeight || 1));
    gl.uniform1f(U.hover, hover);
    gl.uniform1f(U.prog, p);
    gl.uniform1f(U.time, time);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  resize();
  return { draw, resize };
}
