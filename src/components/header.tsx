import { FC, useState } from "react";
import { Link } from "react-scroll";
import { GrCloudComputer } from "react-icons/gr";
import { GiHamburgerMenu } from "react-icons/gi";
import { FaTimes } from "react-icons/fa";

const style = {
  header: `shadow-md sticky top-0 left-0 w-full z-40 items-center mb-8 bg-black`,
  nav: `abosolute left-0 flex md:mx-auto items-center justify-between max-w-[1200px] w-[90%] p-4`,
  Logo: `font-extrabold text-4xl md:text-5xl text-[#fff] flex items-center`,
  navlinks: `bg-slate-100 text-black w-full p-4 md:bg-black font-bold md:mr-20 cursor-pointer md:mb-0 md:text-slate-100 lg:hover:text-slate-400`,
  menutoggle: `text-2xl text-slate-100 font-bold cursor-pointer md:hidden`,
};
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
];

const Header: FC = () => {
  const [togglemenu, setToggleMenu] = useState<boolean>(false);
  const killMenu = () => {
    setToggleMenu(!togglemenu);
  };
  const handleToggle = () => {
    setToggleMenu(!togglemenu);
  };
  return (
    <header
      className={style.header}
      style={{ boxShadow: "0px 2px 0px rgba(255, 255, 255, 0.20)" }}
    >
      <div className={style.nav}>
        <div className={style.Logo}>
          <GrCloudComputer size={30} className="text-slate-200 mr-2" />
          <h1>R</h1>
        </div>
        <ul
          className={`absolute left-0 md:gap-x-14 flex flex-col duration-300 ease-in  w-[100%] md:w-0 md:static ${
            togglemenu ? "top-[100%]" : "top-[-400px]"
          } bg-[#fff]  md:flex-row text-blacck md:flex md:mx-auto`}
        >
          {navlinks.map((item) => (
            <Link
              to={item.url}
              spy={item.spy}
              onClick={killMenu}
              smooth={item.smooth}
              offset={item.offset}
              duration={item.duration}
              className={style.navlinks}
            >
              {item.text}
            </Link>
          ))}
        </ul>
        {!togglemenu ? (
          <GiHamburgerMenu
            onClick={handleToggle}
            className={style.menutoggle}
          />
        ) : (
          <FaTimes onClick={handleToggle} className={style.menutoggle} />
        )}
      </div>
    </header>
  );
};

export default Header;
