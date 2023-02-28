import { useState, FC } from "react";
import "./index.css";
import Header from "./components/header";
import Hero from "./pages/hero";
import AboutPage from "./pages/about";
import SkillsPage from "./pages/skills";
import ProjectPage from "./pages/projects";
import ContactPage from "./pages/contact";
import Footer from "./components/footer";

const style = {
  background: `bg-black w-full font-roboto`,
  container: `md:max-w-5xl w-[90%] mx-auto relative`,
};

const App: FC = () => {
  return (
    <div className={style.background}>
      <Header />
      <div className={style.container}>
        <Hero />
        <AboutPage />
        <SkillsPage />
        <ProjectPage />
        <ContactPage />
        <Footer />
      </div>
    </div>
  );
};

export default App;
