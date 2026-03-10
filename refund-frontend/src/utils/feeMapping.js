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
        "bca",
        "bba",
        "b.voc",
        "computer science",
        "non-medical sfs",
        "banking"
    ];

    const isSfs = sfsCourses.some(course => lowerCourse.includes(course));
    
    return isSfs ? 2000 : 500;
};
