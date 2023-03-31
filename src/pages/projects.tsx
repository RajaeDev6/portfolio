import React from "react";
import SocialImage from "../assets/images/socials.jpg";
import PortfolioImage from "../assets/images/portfolio.jpg";

const projectCards = [
    {
        title: "Social Links",
        text: "This is a project that display my social media handles",
        image: SocialImage,
        link: "https://www.rajae-socials.tk",
        tools: ["REACT JS", "HTML", "CSS"],
    },
    {
        title: "Portfolio",
        text: "This is a my Portfolio",
        image: PortfolioImage,
        link: "https://rajaedev.netlify.app/",
        tools: ["REACT JS", "TYPESCRIPT", "TAILWINDCSS", "VITE"],
    },
    {
        title: "Group Chat",
        text: "A group chat app where friends can communicate and have fun",
        image: "",
        link: "astra-groupchat.tk",
        tools: ["REACT JS + TYPESCRIPT", "TAILWINDCSS", "VITE", "EXPRESS JS", "MONGODB", "SOCKET.IO"],
    },
];

const ProjectPage: React.FC = () => {
    return (
        <div className="flex flex-col" id="projects">
            <h1 className="text-4xl mb-12 md:text-6xl text-[#fff] font-bold text-center">
                Projects
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 justify-center gap-8">
                {projectCards.map((card, index) => (
                    <div key={index} className="card mx-auto w-full bg-black-100 border-solid border-slate-100 border-2 shadow-xl">
                        <figure>
                            <img src={card.image} width="300" className="rounded-lg mt-2" alt="Shoes" />
                        </figure>
                        <div className="card-body">
                            <h2 className="card-title">{card.title}</h2>
                            <p className="mb-2">{card.text}</p>
                            <div className="card-actions justify-end">
                                {card.tools.map((tool, index) => (
                                    <div key={index} className="badge badge-outline">{tool}</div>
                                ))}
                            </div>
                            <a
                                href={card.link}
                                className="btn mt-2 btn-primary btn-md"
                                target="_blank"
                            >
                                Visit
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default ProjectPage;
