import api from './api';

export const getStudentDetails = async (regNo) => {
    try {
        const response = await api.get('https://api.odpay.in/api/view/student', {
            params: {
                entity: '6487ec9e91f7297664a62ffc',
                session: '2024-25 Odd',
                regNo: regNo
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching student details:", error);
        throw error;
    }
};

export const checkStudentDues = async (studentMongoId) => {
    try {
        const response = await api.post('https://api.odpay.in/api/checkDueWithInstallment/student', {
            studentId: studentMongoId,
            installments: ["Annual"],
            entity: '6487ec9e91f7297664a62ffc',
            session: '2024-25 Odd'
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching student dues:", error);
        throw error;
    }
};
