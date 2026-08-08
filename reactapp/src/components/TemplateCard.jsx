import React from "react";

const TemplateCard = ({ template }) => {
  return (
    <div
      className="template-card"
      onClick={() => (window.location.href = `/templates/${template.id}`)}
    >
      <h3>{template.name}</h3>
      <p>{template.category}</p>
    </div>
  );
};

export default TemplateCard;
