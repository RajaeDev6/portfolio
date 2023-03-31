import { FC } from "react";
import Image from "../assets/R.png";
import { Link } from "react-scroll";
import {
    AiFillGithub,
    AiOutlineInstagram,
    AiOutlineTwitter,
} from "react-icons/ai";

const style = {
    content: `flex flex-col-reverse md:flex-row items-center text-[#fff]`,
    span: `font-bold text-[#06D2FF]`,
    img: ` w-[400px] lg:w-[600px] mb-14`,
    contactbutton: `bg-[#06D2FF] rounded-lg cursor-pointer text-black py-2 px-4 md:py-3 mr-8`,
    projectbutton: `bg-[#fff] text-black rounded-lg py-2 px-4 cursor-pointer md:py-3`,
    socialHandles: ` cursor-pointer`,
};

const socials = [
    {
        name: "github",
        link: "https://github.com/RajaeDev6",
        icon: <AiFillGithub size={30} className="text-slate-300" />,
    },
    {
        name: "instagram",
        link: "https://instagram.com/rajae876__",
        icon: <AiOutlineInstagram size={30} className="text-red-400" />,
    },

    {
        name: "twitter",
        link: "https://twitter.com/rajae876_",
        icon: <AiOutlineTwitter size={30} className="text-[#06D2FF]" />,
    },
];

const Main: FC = () => {
    return (
        <div className="w-full mb-20 md:mb-40 lg:mb-0 lg:h-screen " id="hero">
            <div className={style.content}>
                <div className="flex flex-col items-center md:items-start">
                    <h2 className="text-4xl md:text-5xl mt-6">
                        HI, I AM <span className={style.span}>RAJAE</span>
                    </h2>
                    <p className="md:text-xl pt-2 text-slate-200">
                        A Cyber Security student and{" "}
                        <span className={style.span}>Backend Developer.</span>
                    </p>
                    <div className="mt-10">
                        <Link
                            to="contact"
                            spy={true}
                            smooth={true}
                            offset={-150}
                            duration={500}
                            className={style.contactbutton}
                        >
                            Say Hello
                        </Link>
                        <Link
                            to="projects"
                            spy={true}
                            smooth={true}
                            offset={-75}
                            duration={500}
                            className={style.projectbutton}
                        >
                            Projects
                        </Link>
                    </div>
                </div>
                <div>
                    <img
                        src={Image}
                        className={style.img}
                        alt="a man around a computer"
                    />
                </div>
            </div>
            <div>
                <ul className="flex gap-4 mt-16">
                    {socials.map((items) => (
                        <li>
                            <a key={items.name} href={items.link} target="_blank" className={style.socialHandles}>
                                {items.icon}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
export default Main;
