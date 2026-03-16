/**
 * Maps course names to security fee amounts.
 * @param {string} courseName - The name of the course
 * @returns {number} - The security fee (2000 or 500)
 */
export const getSecurityFee = (courseName) => {
    if (!courseName) return 500;

    const lowerCourse = courseName.toLowerCase();
    
    // ₹2000 for specific professional/SFS courses
    const sfsCourses = [
        "bachelor of science (non medical) (self finance)",
        "bachelor of science (computer science) (self finance)",
        "bachelor of vocational in banking, financial service",
        "bachelor of business administration",
        "bachelor of computer applications",
        "bca",
        "bba",
        "b.voc"
    ];

    const isSfs = sfsCourses.some(course => lowerCourse.includes(course));
    
    return isSfs ? 2000 : 500;
};
