import { FC } from "react";
const style = {
    content: `flex flex-col w-full items-center mb-20  md:mb-40 md:mb-72 `,
  heading: `text-4xl text-[#fff] font-bold lg:text-6xl mb-20`,
  para: `text-slate-100 leading-loose`,
  textbox: `lg:w-[700px]`,
  span: `text-[#06D2FF]`,
};
const AboutPage: FC = () => {
  return (
    <div className={style.content} id="about">
      <h1 className={style.heading}>About Me</h1>
      <div className={style.textbox}>
        <p className={style.para}>
          With interests in sports, literature, and video games, I'm a{" "}
          <span className={style.span}>web developer</span> and student of{" "}
          <span className={style.span}>cyber security</span>. You may frequently
          find me honing my <span className={style.span}>football</span>{" "}
          abilities or having a game with my friends on the football field when
          I'm not working on software projects. To escape into another universe,
          I also enjoy curling up with a good book. Moreover, I like to play
          video games and discover new virtual worlds when I need to decompress
          and unwind. Whether it's in my personal life or my line of work, I'm
          always ready for a challenge and enjoy learning new things.
        </p>
      </div>
    </div>
  );
};
export default AboutPage;
