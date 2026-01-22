let currentSvg = null;
let aspectRatio = 116 / 40; // Default aspect ratio (all logos are 116:40)
let updatingDimension = false; // Flag to prevent circular updates

// Embedded SVG logos
const logos = {
    'logo-briox.svg': `<svg width="116" height="40" viewBox="0 0 116 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_370_626)">
<g clip-path="url(#clip1_370_626)">
<path d="M39.0264 24.7583L32.798 20.0091L39.0264 15.26C39.1532 15.1642 39.227 15.015 39.227 14.8567C39.227 14.6983 39.1532 14.5492 39.0264 14.4533L20.5617 0.373325C20.3779 0.232492 20.121 0.232492 19.9372 0.373325L1.47232 14.4525C1.34559 14.5484 1.27173 14.6975 1.27173 14.8558V25.1616C1.27173 25.32 1.34559 25.4692 1.47232 25.565L19.9372 39.645C20.0295 39.715 20.1394 39.75 20.2494 39.75C20.3593 39.75 20.4693 39.715 20.5617 39.645L39.0264 25.565C39.1532 25.4692 39.227 25.32 39.227 25.1616C39.227 25.0033 39.1532 24.8541 39.0264 24.7583ZM31.957 19.3666L20.7622 10.8308V1.80832L37.8724 14.8558L31.957 19.3666ZM20.2494 11.7233L31.1151 20.0091L20.2494 28.295L9.38367 20.0091L20.2494 11.7233ZM19.7366 1.80832V10.83L8.54184 19.3666L2.62638 14.8558L19.7366 1.80832ZM2.29905 15.89L7.70002 20.0091L2.29905 24.1284V15.89ZM20.2494 38.6L2.62638 25.1616L8.54184 20.6508L19.9372 29.34C20.0295 29.41 20.1394 29.445 20.2494 29.445C20.3593 29.445 20.4693 29.41 20.5617 29.34L31.957 20.6508L37.8724 25.1616L20.2494 38.6Z" fill="#FF5000"/>
<path d="M91.3949 14.4183C86.9155 14.3941 83.2637 18.0032 83.273 22.4458C83.2821 26.9199 86.8702 30.5199 91.3437 30.5425C95.7576 30.5649 99.3116 26.9974 99.3604 22.4966C99.4082 18.05 95.8508 14.4425 91.3949 14.4183ZM82.2229 22.4741C82.2179 17.5266 86.3221 13.4508 91.3161 13.4432C96.3183 13.4357 100.428 17.4983 100.43 22.4516C100.431 27.4333 96.3577 31.5124 91.3756 31.5208C86.3364 31.5291 82.228 27.4683 82.2229 22.4741Z" fill="#253746"/>
<path d="M79.7741 13.6583H78.7241V31.1699H79.7741V13.6583Z" fill="#253746"/>
<path d="M114.798 31.1708L107.737 22.1375L114.365 13.6575H113.12L107.101 21.3241L101.11 13.6575H99.8026L106.462 22.1383L99.3694 31.1708H100.677L107.1 22.9516L113.553 31.1708H114.798Z" fill="#253746"/>
<path d="M80.0838 9.40668C80.0838 9.86416 79.7104 10.2359 79.2487 10.2359C78.7871 10.2359 78.4136 9.86504 78.4136 9.40668C78.4136 8.94918 78.7871 8.57751 79.2487 8.57751C79.7104 8.57835 80.0838 8.94918 80.0838 9.40668Z" fill="#253746"/>
<path d="M56.7066 13.4433C53.2335 13.4484 50.1927 15.4225 48.6635 18.2875V6.92249H47.6135V22.4767C47.6194 27.47 51.7279 31.5291 56.7662 31.5216C61.7492 31.5133 65.8215 27.4333 65.8199 22.4525C65.8191 17.4983 61.7089 13.4358 56.7066 13.4433ZM56.7352 30.5425C52.2616 30.52 48.6727 26.92 48.6644 22.4458C48.6551 18.0033 52.307 14.395 56.7864 14.4183C61.2423 14.4425 64.7993 18.05 64.7515 22.4958C64.7028 26.9975 61.1491 30.5642 56.7352 30.5425Z" fill="#253746"/>
<path d="M75.0572 13.5667C71.1888 13.5667 68.0414 16.6841 68.0381 20.5142V31.17H69.088V20.5149C69.0906 17.2591 71.7679 14.6008 75.0572 14.6008H75.7479V13.5667H75.0572Z" fill="#253746"/>
</g>
</g>
<defs>
<clipPath id="clip0_370_626">
<rect width="116" height="40" fill="white"/>
</clipPath>
<clipPath id="clip1_370_626">
<rect width="116" height="40" fill="white"/>
</clipPath>
</defs>
</svg>`,
    'logo-briox-solo.svg': `<svg width="116" height="40" viewBox="0 0 116 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M38.2386 24.8119L31.9303 20.0005L38.2386 15.1891C38.3669 15.0921 38.4417 14.9409 38.4417 14.7805C38.4417 14.6201 38.3669 14.469 38.2386 14.3719L19.5371 0.107375C19.351 -0.0353035 19.0908 -0.0353035 18.9047 0.107375L0.203166 14.371C0.0748061 14.4682 0 14.6193 0 14.7796V25.2205C0 25.381 0.0748061 25.5321 0.203166 25.6291L18.9047 39.8937C18.9981 39.9646 19.1095 40.0001 19.2209 40.0001C19.3322 40.0001 19.4436 39.9646 19.5371 39.8937L38.2386 25.6291C38.3669 25.5321 38.4417 25.381 38.4417 25.2205C38.4417 25.0601 38.3669 24.909 38.2386 24.8119ZM31.0785 19.3496L19.7403 10.7019V1.56118L37.0697 14.7796L31.0785 19.3496ZM19.2209 11.6061L30.2259 20.0005L19.2209 28.395L8.2159 20.0005L19.2209 11.6061ZM18.7015 1.56118V10.7011L7.36328 19.3496L1.37201 14.7796L18.7015 1.56118ZM1.04049 15.8274L6.51067 20.0005L1.04049 24.1737V15.8274ZM19.2209 38.835L1.37201 25.2205L7.36328 20.6506L18.9047 29.4536C18.9981 29.5246 19.1095 29.56 19.2209 29.56C19.3322 29.56 19.4436 29.5246 19.5371 29.4536L31.0785 20.6506L37.0697 25.2205L19.2209 38.835Z" fill="#FF5000"/>
<path d="M50.6633 30.168C52.1804 30.168 53.3352 31.2387 53.3352 32.7686V32.8662H52.2854V32.7686C52.2854 32.2706 52.1146 31.8757 51.8313 31.6055C51.5473 31.3346 51.1425 31.1807 50.6633 31.1807C49.7086 31.1807 49.0413 31.8007 49.0413 32.6611C49.0413 32.9541 49.1099 33.1845 49.2268 33.3721C49.3442 33.5603 49.5141 33.7117 49.7239 33.8408C50.1489 34.1022 50.7161 34.2603 51.3079 34.457C51.8912 34.651 52.4923 34.8813 52.9465 35.2891C53.4064 35.702 53.7092 36.2906 53.7092 37.1826C53.7092 38.8667 52.3727 39.9433 50.7034 39.9434C49.0293 39.9434 47.6976 38.7555 47.6975 37.1025V37.0039H48.7473V37.1025C48.7474 37.652 48.951 38.1069 49.2961 38.4248C49.642 38.7432 50.1371 38.9306 50.7297 38.9307C51.2987 38.9307 51.7811 38.768 52.1194 38.4727C52.456 38.1788 52.6594 37.7455 52.6594 37.1826C52.6594 36.5365 52.3864 36.138 51.9719 35.8477C51.5485 35.5512 50.981 35.3699 50.3918 35.1689C49.8106 34.9707 49.2095 34.7538 48.7561 34.3809C48.2958 34.0023 47.9915 33.4661 47.9915 32.6475C47.9915 31.9051 48.279 31.2831 48.76 30.8477C49.2405 30.4129 49.9089 30.168 50.6633 30.168ZM60.1506 30.168C62.8846 30.1682 65.05 32.312 65.05 35.0557C65.05 37.7993 62.8846 39.9432 60.1506 39.9434C57.43 39.9434 55.2512 37.7996 55.2512 35.0557C55.2512 32.3117 57.43 30.168 60.1506 30.168ZM77.4446 30.168C80.1787 30.168 82.344 32.3119 82.344 35.0557C82.344 37.7994 80.1787 39.9433 77.4446 39.9434C74.7239 39.9434 72.5452 37.7996 72.5452 35.0557C72.5452 32.3117 74.7239 30.168 77.4446 30.168ZM67.6975 38.8232H72.0715V39.8359H66.6477V30.2754H67.6975V38.8232ZM60.1506 31.208C58.0036 31.208 56.301 32.8901 56.301 35.0557C56.301 37.2212 58.0036 38.9033 60.1506 38.9033C62.3106 38.9031 64.0002 37.2213 64.0002 35.0557C64.0002 32.89 62.3106 31.2082 60.1506 31.208ZM77.4446 31.208C75.2975 31.208 73.595 32.8901 73.595 35.0557C73.595 37.2212 75.2975 38.9033 77.4446 38.9033C79.6047 38.9033 81.2942 37.2214 81.2942 35.0557C81.2942 32.8899 79.6047 31.2081 77.4446 31.208ZM48.9075 11.4219C50.44 8.54269 53.4876 6.55881 56.968 6.55371C61.9808 6.54623 66.1 10.6287 66.1008 15.6074C66.1023 20.6129 62.021 24.7133 57.0276 24.7217C51.9788 24.7292 47.8618 20.6498 47.8557 15.6318V0H48.9075V11.4219ZM76.0491 6.55762V7.59668H75.3567C72.0605 7.59668 69.3779 10.2682 69.3752 13.54V24.7217H68.3225V13.5391C68.326 9.69018 71.4803 6.55762 75.3567 6.55762H76.0491ZM80.0833 24.7217H79.0305V6.55762H80.0833V24.7217ZM91.6467 6.55762C96.6759 6.55013 100.808 10.6316 100.81 15.6084C100.811 20.6138 96.7155 24.7132 91.7063 24.7217C86.64 24.7299 82.5095 20.6496 82.5042 15.6318C82.4991 10.6607 86.6257 6.56517 91.6467 6.55762ZM107.692 14.5078L113.915 6.55762H115.202L108.349 15.3516L115.651 24.7188H114.364L107.691 16.1953L101.048 24.7188H99.6965L107.031 15.3525L100.145 6.55762H101.496L107.692 14.5078ZM91.7258 7.53711C87.2222 7.51283 83.5507 11.139 83.5598 15.6025C83.569 20.0979 87.1765 23.7155 91.6741 23.7383C96.1119 23.7608 99.6854 20.1764 99.7346 15.6543C99.7827 11.1865 96.2059 7.56142 91.7258 7.53711ZM57.0481 7.5332C52.5592 7.50977 48.8992 11.136 48.9084 15.6006C48.9169 20.0968 52.5135 23.7145 56.9963 23.7373C61.4196 23.7591 64.9808 20.1745 65.0295 15.6504C65.0773 11.1828 61.5132 7.55764 57.0481 7.5332ZM79.5569 1.66309C80.0195 1.66398 80.3938 2.03733 80.3938 2.49707C80.3936 2.9566 80.0193 3.33002 79.5569 3.33008C79.0945 3.33008 78.7202 2.95752 78.72 2.49707C78.72 2.0373 79.0944 1.66309 79.5569 1.66309Z" fill="#253746"/>
</svg>`,
    'logo-briox-byra.svg': `<svg width="116" height="40" viewBox="0 0 116 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M38.3536 24.8117L32.0263 20.0003L38.3536 15.1888C38.4824 15.0918 38.5574 14.9407 38.5574 14.7802C38.5574 14.6198 38.4824 14.4687 38.3536 14.3716L19.5959 0.10701C19.4092 -0.0356699 19.1483 -0.0356699 18.9615 0.10701L0.203777 14.3707C0.0750311 14.4679 0 14.619 0 14.7794V25.2203C0 25.3808 0.0750311 25.5319 0.203777 25.6289L18.9615 39.8935C19.0553 39.9645 19.167 40 19.2787 40C19.3904 40 19.5021 39.9645 19.5959 39.8935L38.3536 25.6289C38.4824 25.5319 38.5574 25.3808 38.5574 25.2203C38.5574 25.0599 38.4824 24.9088 38.3536 24.8117ZM31.172 19.3493L19.7997 10.7016V1.56082L37.1813 14.7794L31.172 19.3493ZM19.2787 11.6058L30.3168 20.0003L19.2787 28.3948L8.24062 20.0003L19.2787 11.6058ZM18.7578 1.56082V10.7008L7.38543 19.3493L1.37614 14.7794L18.7578 1.56082ZM1.04362 15.8272L6.53026 20.0003L1.04362 24.1735V15.8272ZM19.2787 38.8349L1.37614 25.2203L7.38543 20.6504L18.9615 29.4535C19.0553 29.5244 19.167 29.5598 19.2787 29.5598C19.3904 29.5598 19.5021 29.5244 19.5959 29.4535L31.172 20.6504L37.1813 25.2203L19.2787 38.8349Z" fill="#FF5000"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M49.0553 11.4214C50.5924 8.54223 53.6488 6.55825 57.1397 6.55315C62.1676 6.54561 66.2988 10.6283 66.2996 15.6071C66.3012 20.6127 62.2081 24.713 57.1995 24.7213C52.1354 24.7289 48.0059 20.6496 48 15.6314V0H49.0553V11.4214ZM57.2198 7.53304C52.7175 7.50962 49.0469 11.1358 49.0562 15.6004C49.0647 20.0968 52.6719 23.7147 57.1684 23.7373C61.6049 23.7591 65.1768 20.1747 65.2257 15.6506C65.2738 11.1828 61.6986 7.55736 57.2198 7.53304Z" fill="#253746"/>
<path d="M76.2789 6.55738V7.59663H75.5847C72.2786 7.59663 69.5875 10.2682 69.5849 13.5402V24.7213H68.5296V13.5394C68.5329 9.69032 71.6965 6.55738 75.5847 6.55738H76.2789Z" fill="#253746"/>
<path d="M80.3256 24.7213H79.2702V6.55738H80.3256V24.7213Z" fill="#253746"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M91.9241 6.55738C96.9686 6.54983 101.113 10.6318 101.115 15.6088C101.116 20.6142 97.0084 24.7129 91.9842 24.7213C86.9024 24.7296 82.7592 20.6494 82.7541 15.6313C82.7491 10.6602 86.888 6.56494 91.9241 6.55738ZM92.0036 7.53708C87.4864 7.51277 83.8037 11.1392 83.813 15.6029C83.8223 20.0984 87.4407 23.7156 91.952 23.7383C96.4032 23.7608 99.9872 20.1763 100.036 15.654C100.085 11.1861 96.4972 7.56139 92.0036 7.53708Z" fill="#253746"/>
<path d="M108.018 14.5088L114.26 6.55738H115.551L108.678 15.3524L116 24.7213H114.709L108.017 16.1968L101.356 24.7213H100L107.356 15.3533L100.449 6.55738H101.805L108.018 14.5088Z" fill="#253746"/>
<path d="M79.7974 1.66329C80.2614 1.66414 80.6368 2.03683 80.6368 2.49661C80.6368 2.95634 80.2614 3.32985 79.7974 3.32985C79.3335 3.32985 78.958 2.95722 78.958 2.49661C78.958 2.03683 79.3335 1.6633 79.7974 1.66329Z" fill="#253746"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M50.525 30.0918C51.3729 30.0918 52.0598 30.3107 52.5362 30.7208C53.0144 31.1325 53.2694 31.7274 53.2694 32.4542C53.2694 33.4117 52.7852 34.1314 52.2271 34.5053C53.3375 34.9508 53.8286 35.9785 53.8286 37.078C53.8286 37.9259 53.5443 38.6174 53.054 39.097C52.564 39.5763 51.8765 39.836 51.0842 39.836H47.917V30.0918H50.525ZM48.9866 38.8482H51.0706C51.5707 38.8482 51.9903 38.667 52.2854 38.3463C52.5811 38.0251 52.7589 37.556 52.7589 36.9689C52.7589 36.4942 52.6302 36.0374 52.355 35.7014C52.0822 35.3683 51.6577 35.1441 51.0433 35.1441H48.9866V38.8482ZM48.9866 34.0881H50.6614C51.5319 34.0881 52.1997 33.3573 52.1997 32.5497C52.1997 32.1 52.0601 31.7364 51.7895 31.4845C51.518 31.2319 51.1016 31.0796 50.525 31.0796H48.9866V34.0881Z" fill="#253746"/>
<path d="M58.2471 34.3139L61.1826 30.0918H62.4024L58.7818 35.3898V39.836H57.7121V35.3896L54.1056 30.0918H55.3252L58.2471 34.3139Z" fill="#253746"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M66.7996 30.0918C68.5405 30.0918 69.9668 31.3997 69.9668 33.1499C69.9668 34.7622 68.7925 35.998 67.4443 36.2384L69.8336 39.836H68.615L66.3236 36.3307H64.6884V39.836H63.6187V30.0918H66.7996ZM64.6884 35.3566H66.7996C67.9943 35.3566 68.8971 34.3699 68.8971 33.1499C68.8971 31.9502 68.0009 31.0659 66.7996 31.0659H64.6884V35.3566Z" fill="#253746"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M79.881 39.836H78.7543L77.7041 37.2719H73.0623L72.0121 39.836H70.8858L74.867 30.0918H75.8719L79.881 39.836ZM73.4434 36.2567H77.309L75.3698 31.5927L73.4434 36.2567Z" fill="#253746"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M75.5077 25.5737C76.5037 25.5737 77.311 26.3811 77.311 27.377C77.311 28.3729 76.5037 29.1803 75.5077 29.1803C74.5118 29.1803 73.7045 28.3729 73.7045 27.377C73.7045 26.3811 74.5118 25.5737 75.5077 25.5737ZM75.5077 26.6229C75.0913 26.6229 74.7536 26.9605 74.7536 27.377C74.7536 27.7935 75.0913 28.1311 75.5077 28.1311C75.9242 28.1311 76.2618 27.7935 76.2618 27.377C76.2618 26.9605 75.9242 26.6229 75.5077 26.6229Z" fill="#253746"/>
</svg>`,
    'logomark.svg': `<svg width="38" height="40" viewBox="0 0 38 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M37.7547 24.4906L31.5263 19.7414L37.7547 14.9923C37.8815 14.8965 37.9553 14.7473 37.9553 14.589C37.9553 14.4306 37.8815 14.2815 37.7547 14.1856L19.29 0.105625C19.1062 -0.0352083 18.8493 -0.0352083 18.6655 0.105625L0.20059 14.1848C0.07386 14.2807 0 14.4298 0 14.5881V24.8939C0 25.0523 0.07386 25.2015 0.20059 25.2973L18.6655 39.3773C18.7578 39.4473 18.8677 39.4823 18.9777 39.4823C19.0876 39.4823 19.1976 39.4473 19.29 39.3773L37.7547 25.2973C37.8815 25.2015 37.9553 25.0523 37.9553 24.8939C37.9553 24.7356 37.8815 24.5864 37.7547 24.4906ZM30.6853 19.0989L19.4905 10.5631V1.54062L36.6007 14.5881L30.6853 19.0989ZM18.9777 11.4556L29.8434 19.7414L18.9777 28.0273L8.11194 19.7414L18.9777 11.4556ZM18.4649 1.54062V10.5623L7.27011 19.0989L1.35465 14.5881L18.4649 1.54062ZM1.02732 15.6223L6.42829 19.7414L1.02732 23.8607V15.6223ZM18.9777 38.3323L1.35465 24.8939L7.27011 20.3831L18.6655 29.0723C18.7578 29.1423 18.8677 29.1773 18.9777 29.1773C19.0876 29.1773 19.1976 29.1423 19.29 29.0723L30.6853 20.3831L36.6007 24.8939L18.9777 38.3323Z" fill="#FF5000"/>
</svg>`
};

// Load SVG from embedded data
function loadLogo(filename) {
    return logos[filename] || null;
}

// Get aspect ratio from SVG
function getAspectRatio(svgText) {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;
    
    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
        const parts = viewBox.split(' ');
        const vbWidth = parseFloat(parts[2]);
        const vbHeight = parseFloat(parts[3]);
        return vbWidth / vbHeight;
    }
    
    const width = parseFloat(svgElement.getAttribute('width') || '116');
    const height = parseFloat(svgElement.getAttribute('height') || '40');
    return width / height;
}

// Update preview
function updatePreview(skipDimensionUpdate = false) {
    const logoSelect = document.getElementById('logoSelect');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const width = parseFloat(widthInput.value) || 0;
    const height = parseFloat(heightInput.value) || 0;
    const invertLogomark = document.getElementById('invertLogomark').checked;
    const invertLogotype = document.getElementById('invertLogotype').checked;
    const preview = document.getElementById('preview');

    const svgText = loadLogo(logoSelect.value);
    if (!svgText) {
        alert('Logo not found');
        return;
    }

    // Update aspect ratio when logo changes
    if (!skipDimensionUpdate) {
        aspectRatio = getAspectRatio(svgText);
    }

    // Parse SVG fresh each time to get original colors
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;

    // Get and preserve original viewBox for proper scaling
    let originalViewBox = svgElement.getAttribute('viewBox');
    if (!originalViewBox) {
        const origWidth = svgElement.getAttribute('width') || '116';
        const origHeight = svgElement.getAttribute('height') || '40';
        originalViewBox = `0 0 ${origWidth} ${origHeight}`;
    }

    // Update dimensions - preserve viewBox to maintain aspect ratio
    svgElement.setAttribute('width', width);
    svgElement.setAttribute('height', height);
    svgElement.setAttribute('viewBox', originalViewBox);

    // Apply color inversion
    const allElements = svgElement.querySelectorAll('*');
    allElements.forEach(element => {
        const fill = element.getAttribute('fill');
        
        if (fill) {
            // Invert logomark (orange #FF5000) to white
            if (invertLogomark && fill === '#FF5000') {
                element.setAttribute('fill', '#FFFFFF');
            }
            
            // Invert logotype (dark blue #253746) to white
            if (invertLogotype && fill === '#253746') {
                element.setAttribute('fill', '#FFFFFF');
            }
        }
    });

    // Clear and add to preview
    preview.innerHTML = '';
    preview.appendChild(svgElement.cloneNode(true));

    // Store current SVG for export
    currentSvg = svgElement.cloneNode(true);
}

// Export as SVG
function exportSVG() {
    if (!currentSvg) {
        alert('Please wait for the logo to load');
        return;
    }

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(currentSvg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const logoSelect = document.getElementById('logoSelect');
    const filename = logoSelect.value.replace('.svg', '') + '-export.svg';
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Export as PNG
async function exportPNG() {
    if (!currentSvg) {
        alert('Please wait for the logo to load');
        return;
    }

    const width = parseInt(document.getElementById('width').value);
    const height = parseInt(document.getElementById('height').value);
    const logoSelect = document.getElementById('logoSelect');

    // Create a canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Create an image from SVG
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(currentSvg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    
    img.onload = function() {
        // Draw image to canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to PNG and download
        canvas.toBlob(function(blob) {
            const downloadUrl = URL.createObjectURL(blob);
            const filename = logoSelect.value.replace('.svg', '') + '-export.png';
            
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            URL.revokeObjectURL(downloadUrl);
        }, 'image/png');
    };

    img.onerror = function() {
        alert('Error exporting PNG. Please try again.');
        URL.revokeObjectURL(url);
    };

    img.src = url;
}

// Download handler
function handleDownload() {
    const format = document.getElementById('format').value;
    
    if (format === 'svg') {
        exportSVG();
    } else {
        exportPNG();
    }
}

// Copy to clipboard handler
async function handleCopy() {
    if (!currentSvg) {
        alert('Please wait for the logo to load');
        return;
    }

    const format = document.getElementById('format').value;
    
    if (format === 'svg') {
        // Copy SVG as text
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(currentSvg);
        
        try {
            await navigator.clipboard.writeText(svgString);
            showCopyFeedback('SVG copied to clipboard!');
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = svgString;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                showCopyFeedback('SVG copied to clipboard!');
            } catch (fallbackErr) {
                alert('Failed to copy to clipboard. Please use the download button instead.');
            }
            document.body.removeChild(textArea);
        }
    } else {
        // Copy PNG as image
        const width = parseInt(document.getElementById('width').value);
        const height = parseInt(document.getElementById('height').value);

        // Create a canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Create an image from SVG
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(currentSvg);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        
        img.onload = async function() {
            // Draw image to canvas
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to blob and copy to clipboard
        canvas.toBlob(async function(blob) {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    showCopyFeedback('PNG copied to clipboard!');
                } catch (err) {
                    alert('Failed to copy PNG to clipboard. Please use the download button instead.');
                }
                URL.revokeObjectURL(url);
            }, 'image/png');
        };

        img.onerror = function() {
            alert('Error copying PNG. Please try again.');
            URL.revokeObjectURL(url);
        };

        img.src = url;
    }
}

// Show copy feedback message
function showCopyFeedback(message) {
    const copyBtn = document.getElementById('copyBtn');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = message;
    copyBtn.style.background = '#4caf50';
    
    setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.background = '';
    }, 2000);
}

// Handle width change - update height to maintain ratio
function handleWidthChange() {
    if (updatingDimension) return;
    
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const width = parseFloat(widthInput.value);
    
    if (width && width > 0) {
        updatingDimension = true;
        const newHeight = Math.round(width / aspectRatio);
        heightInput.value = newHeight;
        updatingDimension = false;
        updatePreview(true);
    }
}

// Handle height change - update width to maintain ratio
function handleHeightChange() {
    if (updatingDimension) return;
    
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const height = parseFloat(heightInput.value);
    
    if (height && height > 0) {
        updatingDimension = true;
        const newWidth = Math.round(height * aspectRatio);
        widthInput.value = newWidth;
        updatingDimension = false;
        updatePreview(true);
    }
}

// Event listeners
document.getElementById('logoSelect').addEventListener('change', () => {
    const logoSelect = document.getElementById('logoSelect');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    
    // Reset dimensions to default when logo changes
    const svgText = loadLogo(logoSelect.value);
    if (svgText) {
        const ratio = getAspectRatio(svgText);
        const defaultWidth = logoSelect.value === 'logomark.svg' ? 80 : 200;
        widthInput.value = defaultWidth;
        heightInput.value = Math.round(defaultWidth / ratio);
    }
    updatePreview();
});
document.getElementById('width').addEventListener('input', handleWidthChange);
document.getElementById('height').addEventListener('input', handleHeightChange);

// Handle logomark inversion with dependency logic
document.getElementById('invertLogomark').addEventListener('change', function() {
    const invertLogomark = document.getElementById('invertLogomark');
    const invertLogotype = document.getElementById('invertLogotype');
    
    // If logomark is checked, also check logotype
    if (invertLogomark.checked) {
        invertLogotype.checked = true;
    }
    
    updatePreview(true);
});

// Handle logotype inversion with dependency logic
document.getElementById('invertLogotype').addEventListener('change', function() {
    const invertLogomark = document.getElementById('invertLogomark');
    const invertLogotype = document.getElementById('invertLogotype');
    
    // If logotype is unchecked and logomark is checked, uncheck logomark too
    if (!invertLogotype.checked && invertLogomark.checked) {
        invertLogomark.checked = false;
    }
    
    updatePreview(true);
});

document.getElementById('format').addEventListener('change', () => {}); // No preview update needed
document.getElementById('downloadBtn').addEventListener('click', handleDownload);
document.getElementById('copyBtn').addEventListener('click', handleCopy);

// Initial load
updatePreview();

// Set last update date
const lastUpdate = document.getElementById('lastUpdate');
if (lastUpdate) {
    lastUpdate.textContent = new Date().toLocaleDateString();
}
