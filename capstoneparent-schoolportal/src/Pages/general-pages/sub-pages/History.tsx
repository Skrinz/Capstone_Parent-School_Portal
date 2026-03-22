import { RoleAwareNavbar } from "@/components/general/RoleAwareNavbar";

export const History = () => {
  const principals = [
    { years: "1972 - 1979", name: "Mrs. Jacinta Sanchez" },
    { years: "1979 – 1983", name: "Mrs. Virginia Lobitania" },
    { years: "1983 – 1985", name: "Mrs. Geronima Acot" },
    { years: "1985 – 1987", name: "Dr. Enriquita Enriquez" },
    { years: "1987 – 1989", name: "Mrs. Meriam Dotosme" },
    { years: "1989 – 1991", name: "Mr. Paterno Belarma" },
    { years: "1991 – 2000", name: "Mrs. Ma. Dolores B. Banogon" },
    { years: "2000 – 2004", name: "Mrs. Lydia Tagalog" },
    { years: "2004 – 2006", name: "Mr. Raul M. Llego" },
    { years: "2006 – 2009", name: "Mrs. Corazon M. Yosores" },
    { years: "2009 - 2013", name: "Mr. Alejandro S. Lamdagan" },
    { years: "2013 – 2015", name: "Mrs. Mary Jean B. Codiñera" },
    { years: "2015 - 2017", name: "Mrs. Merinisa J. Olvido" },
    { years: "2017 – Present", name: "Mrs. Gemma H. Tangoan" },
  ];

  return (
    <div>
      <RoleAwareNavbar />
      <div className="max-w-7xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">
          BRIEF HISTORY OF PAGSABUNGAN ELEMENTARY SCHOOL
        </h1>

        <img
          src="/History_Pic.jpg"
          alt="Pagsabungan Elementary School"
          className="w-full h-80 object-cover mb-8"
        />

        <div className="text-justify space-y-4 text-sm leading-relaxed">
          <p>
            Pagsabungan Elementary School is situated in Z. Estreras St. Sector
            7, Pagsabungan, Mandaue City. The area of the school site is 2, 427
            sq. meters and it was donated by late barangay captain Sergio B.
            Toling. According to the locals, the barangay got its name from the
            word "sabong" (cockfighting) which the folks love to do in their
            leisure time.
          </p>

          <p>
            The school was established in 1972. It started with only one
            building called the "MARCOS BUILDING" which catered the Grades One
            and Two. Mrs. Benilda P. Lapa was the first and lone teacher. She
            created the school organ named "the light-bringer". The school was
            supervised by the school principal of Basak Elementary School, Mrs.
            Jacinta Sanchez.
          </p>

          <p>
            In 1976, Bagong Lipunan school building with 3 classrooms was
            constructed. Staff members/School personnel were added until all the
            grade levels were filled (Grade I- VI)
          </p>

          <p>
            In 1978, the school produced the first batch of graduates composed
            of only a few pupils (approximately 17 pupils).
          </p>

          <p>
            The Multipurpose H.E. building was built in 1980, followed by Bagong
            Lipunan building with 3 classrooms in 1983 (annex building) and a
            two-story building with 6 classrooms in the succeeding year to
            answer the needs of the growing population of the school.
          </p>

          <p>
            As years go by, enrollment continues to rise. Numerous renovations
            and innovations were made. There are a lot of developments in the
            school like the presence of Aboitiz building that housed the five
            sections in Grade Six and one section in Grade V, the creation of an
            E-classroom, and the school library.
          </p>

          <p>
            The school at present fosters and practice the vision of the
            Department of Education which states that "We dream of Filipinos who
            passionately love their country and whose values and competencies
            enable them to realize their full potential and contribute
            meaningfully to building the nation. As a learner-centered public
            institution, the Department of Education continuously improves
            itself to better serve its stakeholders" and live with the mission
            which states "To protect and promote the right of every Filipino to
            quality, equitable, culture-based, and complete basic education
            where:
          </p>

          <p>
            <strong>Students</strong> learn in a child-friendly,
            gender-sensitive, safe, and motivating environment.
          </p>

          <p>
            <strong>Teachers</strong> facilitate learning and constantly nurture
            every learner.
          </p>

          <p>
            <strong>Administrators and staff,</strong> as stewards of the
            institution, ensure an enabling and supportive environment for
            effective learning to happen.
          </p>

          <p>
            <strong>Family, community, and other stakeholders</strong> are
            actively engaged and share responsibility for developing life-long
            learners."
          </p>

          <p>
            In this manner, teachers continued escalating and bringing out the
            best of every learner and assisting them to develop their talents
            and skills to their finest. The school received several awards and
            was recently recognized as the most child-friendly school and one of
            the outstanding schools in the Mandaue City Division with the
            supervision of Mrs. Gemma H. Tangoan.
          </p>

          <p>
            As long as there are children in the community, there is always
            Pagsabungan Elementary School who continuously spread its legacy.
            "Kaysa Pagsabungan Elementary School bida ka, bata ka".
          </p>

          <p>
            Here are the lists of the administrators who have been part of
            molding and shaping up the wildest little dreams of each pupil from
            past to present.
          </p>
        </div>

        <div className="mt-8">
          <table className="w-full text-sm">
            <tbody>
              {principals.map((principal, index) => (
                <tr key={index}>
                  <td className="py-2 px-2 w-1/4">{principal.years}</td>
                  <td className="py-2 px-2 w-3/4">{principal.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-b"></div>
      </div>
    </div>
  );
};
