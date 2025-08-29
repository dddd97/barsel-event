import{j as t}from"./ui-CmEgarRF.js";import{r}from"./vendor-Ce54acmE.js";const P=({isSpinning:u,winner:a,prize:x,slotAnimation:i,onSpinComplete:E,className:$=""})=>{const[b,p]=r.useState(!1),[k,y]=r.useState(!1),[N,S]=r.useState([!1,!1,!1,!1,!1]),[c,A]=r.useState(null),W=r.useRef(null),T=r.useRef(null),M=r.useRef(null),Y=r.useRef(null),G=r.useRef(null),m=[W,T,M,Y,G],f=r.useRef([]),h=r.useRef([]),g=r.useCallback(()=>{p(!1),y(!1),S([!1,!1,!1,!1,!1]),f.current.forEach(e=>clearInterval(e)),h.current.forEach(e=>clearTimeout(e)),f.current=[],h.current=[],m.forEach(e=>{e.current&&(e.current.style.transition="none",e.current.style.transform="translateY(0px)")})},[]);r.useEffect(()=>(console.log("SlotMachine useEffect:",{isSpinning:u,hasSlotAnimation:!!i,hasWinner:!!a,slotAnimationKeys:i?Object.keys(i):null}),u&&i&&a?(g(),setTimeout(()=>{H()},100)):u||g(),()=>{g()}),[u,i,a,g]);const H=async()=>{console.log("startSlotAnimation called:",{slotAnimation:!!i,winner:!!a,animationWinner:!!c});const e=c||a;if(!i||!e){console.log("Early return from startSlotAnimation");return}A(e),p(!0),y(!1),console.log("Starting slot animation for winner:",e?.registrationNumber),m.forEach((l,o)=>{l.current&&K(l.current,o)});const n=i.reelDelays||[1e3,2e3,3e3,4e3,5e3];n.forEach((l,o)=>{const d=setTimeout(()=>{z(o)},l);h.current.push(d)});const s=setTimeout(()=>{console.log("All reels stopped, showing winner"),console.log("Setting showWinner to true"),y(!0),p(!1),E?.()},Math.max(...n)+2e3);h.current.push(s)},K=r.useCallback((e,n)=>{let s=0;const l=80,o=v(n);if(o.length===0)return;e.style.transition="none";const d=setInterval(()=>{s-=l,Math.abs(s)>=o.length*l&&(s=0),e.style.transform=`translateY(${s}px)`},100);f.current[n]=d},[]),z=r.useCallback(e=>{if(e<0||e>=m.length){console.error(`Invalid reelIndex: ${e}, reelRefs.length: ${m.length}`);return}const n=m[e];if(!n){console.error(`reelRefs[${e}] is undefined`);return}const s=c||a;if(!n.current||N[e]){console.log(`Early return: ref.current=${!!n.current}, stoppedReels[${e}]=${N[e]}`);return}console.log(`Stopping reel ${e} with currentWinner:`,s),f.current[e]&&clearInterval(f.current[e]),S(R=>{const D=[...R];return D[e]=!0,D});const l=80,d=(s?.registrationNumber?.replace(/-/g,"")||"")[e]||"0";let j=v(e).findIndex(R=>R===d);j===-1&&(j=2);const B=-(j*l)+l*1;n.current.style.transition="transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)",n.current.style.transform=`translateY(${B}px)`,setTimeout(()=>{n.current&&n.current.classList.add("winner-highlight")},800)},[m,a,c,N]),v=e=>{if(console.log("getReelData called with reelIndex:",e,"slotAnimation:",i),!i)return console.warn("slotAnimation is null in getReelData"),Array.from({length:20},(o,d)=>(d%10).toString());const n=`reel${e+1}`;let s=i[n];(!s||s.length===0)&&(console.warn(`reel${e+1} is empty, using default data`),s=Array.from({length:20},(o,d)=>(d%10).toString()));const l=c||a;if(l?.registrationNumber){const o=l.registrationNumber.replace(/-/g,"");if(o[e]){const d=o[e],w=[...s];return w[2]=d,w}}return s},C=()=>{const e=c||a;if(!e?.registrationNumber)return["?","?","?","?","?"];const s=e.registrationNumber.replace(/-/g,"").split("");for(;s.length<5;)s.unshift("0");return s.slice(0,5)};return t.jsxs("div",{className:`slot-machine ${$}`,children:[t.jsx("style",{children:`
        .slot-machine {
          font-family: 'Arial Black', Arial, sans-serif;
        }
        
        .reel-container {
          position: relative;
        }
        
        .reel-window {
          position: relative;
          width: 80px;
          height: 240px;
          background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
          border: 4px solid #343a40;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 
            inset 0 0 20px rgba(0, 0, 0, 0.3),
            0 0 15px rgba(0, 0, 0, 0.2);
        }
        
        .reel-window::before {
          content: '';
          position: absolute;
          top: 80px;
          left: 0;
          right: 0;
          height: 80px;
          border: 3px solid #dc2626;
          border-left: none;
          border-right: none;
          background: rgba(220, 38, 38, 0.1);
          z-index: 10;
          pointer-events: none;
        }
        
        .reel-strip {
          position: relative;
          transition: none;
        }
        
        .winner-highlight {
          filter: drop-shadow(0 0 10px #22c55e);
        }
        
        .slot-item {
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 900;
          color: #1f2937;
          background: linear-gradient(to bottom, #ffffff, #f3f4f6);
          border-bottom: 2px solid #e5e7eb;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        @keyframes sparkle {
          0%, 100% { opacity: 0.7; transform: scale(1) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.1) rotate(180deg); }
        }
        
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
          40%, 43% { transform: translateY(-15px); }
          70% { transform: translateY(-7px); }
          90% { transform: translateY(-3px); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        
        @keyframes winnerGlow {
          0%, 100% { 
            box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
            border-color: #22c55e;
          }
          50% { 
            box-shadow: 0 0 30px rgba(34, 197, 94, 0.8);
            border-color: #16a34a;
          }
        }
      `}),t.jsxs("div",{className:"relative bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600 rounded-2xl p-8 shadow-2xl border-4 border-yellow-300",children:[t.jsx("div",{className:"absolute inset-0 rounded-2xl opacity-60",style:{background:"linear-gradient(45deg, transparent, rgba(255, 215, 0, 0.4), transparent)",animation:"sparkle 3s ease-in-out infinite"}}),t.jsxs("div",{className:"text-center mb-6 relative z-10",children:[t.jsx("h2",{className:"text-4xl font-bold text-white drop-shadow-lg mb-2",children:"🎰 UNDIAN BERHADIAH 🎰"}),x&&t.jsxs("div",{className:"bg-white/95 rounded-lg p-4 mx-4 shadow-lg",children:[t.jsx("p",{className:"text-2xl font-bold text-gray-800",children:x.name}),t.jsx("p",{className:"text-sm text-gray-600 uppercase tracking-wide font-semibold",children:x.category})]})]}),t.jsxs("div",{className:"relative bg-gray-800 rounded-xl p-6 shadow-inner border-4 border-gray-600",children:[t.jsx("div",{className:"flex justify-center gap-3",children:[0,1,2,3,4].map(e=>t.jsxs("div",{className:"reel-container",children:[t.jsx("div",{className:"reel-window",children:t.jsx("div",{ref:m[e],className:"reel-strip","data-reel-index":e,children:v(e).map((n,s)=>t.jsx("div",{className:"slot-item",children:n},`${n}-${s}-${e}`))})}),t.jsx("div",{className:"text-center mt-2",children:t.jsxs("span",{className:"text-sm font-bold text-white drop-shadow",children:["POS ",e+1]})})]},e))}),t.jsxs("div",{className:"mt-4 text-center",children:[t.jsx("div",{className:"text-white text-lg font-semibold mb-2",children:"Nomor Kupon:"}),t.jsx("div",{className:"bg-black/50 rounded-lg px-4 py-2 inline-block",children:t.jsx("span",{className:"text-yellow-400 text-2xl font-mono font-bold tracking-wider",children:C().join("")})})]})]}),t.jsxs("div",{className:"mt-6 text-center relative z-10",children:[b&&t.jsx("div",{className:"bg-red-500 text-white px-8 py-4 rounded-full inline-block border-4 border-red-300 shadow-xl",style:{animation:"pulse 1.5s ease-in-out infinite"},children:t.jsx("span",{className:"text-2xl font-bold",children:"🎲 SEDANG MENGUNDI... 🎲"})}),t.jsxs("div",{className:"text-white text-xs mb-2",children:["Debug: showWinner=",k.toString(),", isAnimating=",b.toString(),", hasWinner=",!!(c||a)]}),k&&(c||a)&&!b&&t.jsxs("div",{className:"bg-green-500 text-white p-8 rounded-3xl border-4 border-green-300 shadow-2xl relative z-20",style:{animation:"winnerGlow 2s ease-in-out infinite"},children:[t.jsx("div",{className:"text-5xl font-bold mb-4",children:"🎉 SELAMAT! 🎉"}),t.jsx("div",{className:"text-4xl font-bold mb-3 text-yellow-300",children:(c||a)?.name}),t.jsxs("div",{className:"text-2xl mb-3 font-mono bg-white/20 rounded-lg px-4 py-2 inline-block",children:["Kupon: ",(c||a)?.registrationNumber]}),t.jsx("div",{className:"text-xl text-green-100 mb-4",children:(c||a)?.institution}),t.jsxs("div",{className:"text-2xl text-yellow-300 font-semibold",children:["Memenangkan: ",x?.name]}),t.jsx("div",{className:"absolute -top-4 -left-4 text-3xl animate-bounce",children:"🎊"}),t.jsx("div",{className:"absolute -top-4 -right-4 text-3xl animate-bounce",style:{animationDelay:"0.5s"},children:"🎊"}),t.jsx("div",{className:"absolute -bottom-4 -left-4 text-3xl animate-bounce",style:{animationDelay:"1s"},children:"🎊"}),t.jsx("div",{className:"absolute -bottom-4 -right-4 text-3xl animate-bounce",style:{animationDelay:"1.5s"},children:"🎊"})]})]}),t.jsx("div",{className:"absolute top-6 left-6 text-4xl",style:{animation:"sparkle 4s linear infinite"},children:"⭐"}),t.jsx("div",{className:"absolute top-6 right-6 text-4xl",style:{animation:"sparkle 4s linear infinite reverse"},children:"⭐"}),t.jsx("div",{className:"absolute bottom-6 left-6 text-4xl",style:{animation:"bounce 3s infinite"},children:"💎"}),t.jsx("div",{className:"absolute bottom-6 right-6 text-4xl",style:{animation:"bounce 3s infinite 0.5s"},children:"💎"})]})]})};export{P as default};
