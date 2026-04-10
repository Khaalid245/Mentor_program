// CareerPathCard — displays a career path's full details
// Used on StudentDashboard to show the student's chosen path

const CareerPathCard = ({ careerPath }) => {
  if (!careerPath) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-blue-700">{careerPath.title}</h3>

      <p className="text-sm text-gray-700 leading-relaxed">
        {careerPath.description}
      </p>

      {careerPath.skills_required && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs font-semibold text-blue-700 mb-1">Skills Required</p>
          <p className="text-sm text-gray-700">{careerPath.skills_required}</p>
        </div>
      )}

      {careerPath.university_options && (
        <div className="bg-purple-50 p-3 rounded-lg">
          <p className="text-xs font-semibold text-purple-700 mb-1">University Options</p>
          <p className="text-sm text-gray-700">{careerPath.university_options}</p>
        </div>
      )}

      {careerPath.scholarship_info && (
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs font-semibold text-green-700 mb-1">Scholarship Opportunities</p>
          <p className="text-sm text-gray-700">{careerPath.scholarship_info}</p>
        </div>
      )}
    </div>
  );
};

export default CareerPathCard;
