import { FC } from "react";
import { Link } from "react-scroll";
import {
  AiFillGithub,
  AiOutlineInstagram,
  AiOutlineTwitter,
} from "react-icons/ai";

const style = {
  navlinks: `link link-hover`,
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

const navlinks = [
  {
    url: "hero",
    text: "Home",
    spy: true,
    smooth: true,
    offset: -180,
    duration: 500,
  },
  {
    url: "skills",
    text: "Skills",
    spy: true,
    smooth: true,
    offset: -180,
    duration: 500,
  },
  {
    url: "about",
    text: "About",
    spy: true,
    smooth: true,
    offset: -180,
    duration: 500,
  },
  {
    url: "projects",
    text: "Project",
    spy: true,
    smooth: true,
    offset: -180,
    duration: 500,
  },
];

const Footer: FC = () => {
  return (
    <footer className="footer items-center footer-center p-5 bg-base-200 text-base-content rounded">
      <div className="grid grid-flow-col gap-4">
        {navlinks.map((item,index) => (
          <Link
                        key={index}
            to={item.url}
            spy={item.spy}
            smooth={item.smooth}
            offset={item.offset}
            duration={item.duration}
            className={style.navlinks}
          >
            {item.text}
          </Link>
        ))}
      </div>
      <div>
        <div className="grid grid-flow-col gap-4">
          {socials.map((items) => (
              <a
                key={items.name}
                href={items.link}
                target="_blank"
                className={style.socialHandles}
              >
                {items.icon}
              </a>
          ))}
        </div>
      </div>
      <div>
        <p>Copyright © 2023</p>
      </div>
    </footer>
  );
};
export default Footer;
