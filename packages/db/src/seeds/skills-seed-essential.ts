import { skillCategories } from '../schema/skill-categories';
import { skills } from '../schema/skills';

export async function seedSkillsEssential(db: any) {
    console.log('  - Seeding Essential Skills Taxonomy...');

    const categories = [
        { name: 'Programming & Development', description: 'Software engineering and coding skills.' },
        { name: 'Leadership & Management', description: 'Skills related to leading teams and strategic planning.' },
        { name: 'Office Productivity', description: 'Standard office software and administrative tools.' },
        { name: 'Cloud & Infrastructure', description: 'Cloud platforms, DevOps, and server management.' },
        { name: 'Design & Creative', description: 'UI/UX design, graphic design, and content creation.' },
        { name: 'Soft Skills', description: 'Communication, emotional intelligence, and interpersonal skills.' },
        { name: 'HR & Compliance', description: 'Human resources, labor laws, and regulatory compliance.' },
        { name: 'Security', description: 'Cybersecurity, data protection, and network security.' },
        { name: 'Quality Assurance', description: 'Software testing, automation, and QA processes.' },
        { name: 'Product Management', description: 'Product strategy, roadmap, and requirement analysis.' },
        { name: 'Sales & Marketing', description: 'Business development, marketing strategy, and client relations.' },
    ];

    for (const cat of categories) {
        await db.insert(skillCategories).values(cat).onConflictDoUpdate({
            target: skillCategories.name,
            set: { description: cat.description, updatedAt: new Date() }
        });
    }

    const categoryMap = new Map<string, string>();
    const allCats = await db.select().from(skillCategories);
    allCats.forEach((c: any) => categoryMap.set(c.name, c.id));

    const skillsData = [
        // Programming
        { name: 'TypeScript', categoryName: 'Programming & Development', description: 'Strict syntactical superset of JavaScript.' },
        { name: 'React', categoryName: 'Programming & Development', description: 'Frontend UI library.' },
        { name: 'Node.js', categoryName: 'Programming & Development', description: 'JavaScript runtime.' },
        { name: 'SQL', categoryName: 'Programming & Development', description: 'Structured Query Language for databases.' },
        { name: 'Go', categoryName: 'Programming & Development', description: 'Google-developed compiled language.' },
        { name: 'Python', categoryName: 'Programming & Development', description: 'Interpreted high-level programming language.' },
        { name: 'Java', categoryName: 'Programming & Development', description: 'Object-oriented programming language.' },
        { name: 'C#', categoryName: 'Programming & Development', description: 'Microsoft-developed language for .NET.' },

        // Leadership
        { name: 'Strategic Planning', categoryName: 'Leadership & Management', description: 'Defining organization direction.' },
        { name: 'Team Mentorship', categoryName: 'Leadership & Management', description: 'Guiding and developing team members.' },
        { name: 'Conflict Resolution', categoryName: 'Leadership & Management', description: 'Settling disputes effectively.' },
        { name: 'Budget Management', categoryName: 'Leadership & Management', description: 'Managing financial resources.' },
        { name: 'Performance Management', categoryName: 'Leadership & Management', description: 'Evaluating and improving employee output.' },

        // Cloud
        { name: 'AWS', categoryName: 'Cloud & Infrastructure', description: 'Amazon Web Services.' },
        { name: 'Docker', categoryName: 'Cloud & Infrastructure', description: 'Containerization platform.' },
        { name: 'Kubernetes', categoryName: 'Cloud & Infrastructure', description: 'Container orchestration.' },
        { name: 'Terraform', categoryName: 'Cloud & Infrastructure', description: 'Infrastructure as Code.' },
        { name: 'Azure', categoryName: 'Cloud & Infrastructure', description: 'Microsoft Cloud Services.' },
        { name: 'Google Cloud Platform', categoryName: 'Cloud & Infrastructure', description: 'Google Cloud Services.' },

        // Office
        { name: 'Microsoft Excel', categoryName: 'Office Productivity', description: 'Spreadsheet software.' },
        { name: 'Project Management (Jira)', categoryName: 'Office Productivity', description: 'Agile project tracking.' },
        { name: 'Technical Writing', categoryName: 'Office Productivity', description: 'Creating technical documentation.' },
        { name: 'Slack/Communication Tools', categoryName: 'Office Productivity', description: 'Efficient workplace communication.' },

        // Soft Skills
        { name: 'Public Speaking', categoryName: 'Soft Skills', description: 'Oral communication to a group.' },
        { name: 'Negotiation', categoryName: 'Soft Skills', description: 'Reaching agreements.' },
        { name: 'Time Management', categoryName: 'Soft Skills', description: 'Managing productivity.' },
        { name: 'Critical Thinking', categoryName: 'Soft Skills', description: 'Logical and analytical problem-solving.' },

        // Compliance
        { name: 'Data Privacy (GDPR)', categoryName: 'HR & Compliance', description: 'Global data protection regulations.', expiryMonths: 12 },
        { name: 'Sexual Harassment Prevention', categoryName: 'HR & Compliance', description: 'Mandatory workplace training.', expiryMonths: 12 },
        { name: 'Workplace Safety', categoryName: 'HR & Compliance', description: 'Occupational health and safety.', expiryMonths: 24 },
        { name: 'Code of Conduct', categoryName: 'HR & Compliance', description: 'Corporate ethics and behavior standards.' },

        // Quality Assurance
        { name: 'Unit Testing (Jest)', categoryName: 'Quality Assurance', description: 'Testing individual code units.' },
        { name: 'End-to-End Testing (Cypress/Playwright)', categoryName: 'Quality Assurance', description: 'Testing full application flows.' },
        { name: 'Test-Driven Development', categoryName: 'Quality Assurance', description: 'Writing tests before code.' },
        { name: 'API Testing', categoryName: 'Quality Assurance', description: 'Validating backend interfaces.' },

        // Product Management
        { name: 'Roadmap Development', categoryName: 'Product Management', description: 'Planning product milestones.' },
        { name: 'User Persona Creation', categoryName: 'Product Management', description: 'Defining target audience.' },
        { name: 'A/B Testing Strategy', categoryName: 'Product Management', description: 'Evaluating feature variations.' },

        // Sales & Marketing
        { name: 'CRM Management', categoryName: 'Sales & Marketing', description: 'Using tools like Salesforce.' },
        { name: 'SEO Optimization', categoryName: 'Sales & Marketing', description: 'Improving search visibility.' },
        { name: 'B2B Sales', categoryName: 'Sales & Marketing', description: 'Business-to-business sales techniques.' },
    ];

    for (const skill of skillsData) {
        const categoryId = categoryMap.get(skill.categoryName);
        if (categoryId) {
            await db.insert(skills).values({
                name: skill.name,
                categoryId: categoryId,
                description: skill.description,
                expiryMonths: (skill as any).expiryMonths || null,
                isActive: true
            }).onConflictDoNothing();
        }
    }
}
