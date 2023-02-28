import { FC } from "react";
import { FaReact } from "react-icons/fa";
import { FcLinux } from "react-icons/fc";
import { DiJavascript1, DiMongodb, DiPython } from "react-icons/di";
import {
  SiTypescript,
  SiMysql,
  SiTailwindcss,
  SiGnubash,
} from "react-icons/si";
import { IoLogoNodejs } from "react-icons/io";

const style = {
  content: `flex flex-col py-20 mb-10`,
  heading: `text-4xl lg:text-6xl text-[#fff] text-center font-bold mb-20`,
  list: `text-black font-bold bg-[#06D2FF] p-4`,
  skills: `grid grid-cols-2 gap-x-4 gap-y-10 md:gap-20 md:grid-cols-3`,
  listitems1: ` rounded-lg text-black text-lg md:text-2xl flex font-bold md:p-8 bg-[#06D2FF] p-2 gap-4 justify-center items-center`,
  listitems2: `text-black rounded-lg font-bold text-lg md:text-2xl bg-[#fff] p-2 md:p-8 flex items-center justify-center gap-4`,
};
const SkillsPage: FC = () => {
  return (
    <div className={style.content} id="skills">
      <h1 className={style.heading}>Skills</h1>
      <div>
        <ul className={style.skills}>
          <li className={style.listitems1}>
            React js <FaReact size={30} />
          </li>
          <li className={style.listitems2}>
            Javascript <DiJavascript1 size={30} />
          </li>
          <li className={style.listitems1}>
            Typescript <SiTypescript size={30} />
          </li>
          <li className={style.listitems2}>
            Mysql <SiMysql size={30} />
          </li>
          <li className={style.listitems1}>
            MongoDb <DiMongodb size={30} />
          </li>
          <li className={style.listitems2}>
            Linux <FcLinux size={30} />
          </li>
          <li className={style.listitems1}>
            Flask <DiPython size={30} />
          </li>
          <li className={style.listitems2}>
            Tailwindcss <SiTailwindcss size={30} />
          </li>
          <li className={style.listitems1}>
            Bash
            <SiGnubash size={30} />
          </li>
          <li className={style.listitems2}>
            Express js
            <IoLogoNodejs size={30} />
          </li>
        </ul>
      </div>
    </div>
  );
};
export default SkillsPage;
