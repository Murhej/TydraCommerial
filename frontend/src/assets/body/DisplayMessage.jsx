import React from 'react';

import DollarIcon   from '../../../public/dollarSign.png';
import LocationIcon from '../../../public/location.png';
import GuaranteeIcon  from '../../../public/guarantee.png';
import StaffIcon      from '../../../public/staff.png';
import leafIcon      from '../../../public/leafIcon.png';


import './DisplayMessage.css';

const features = [
  {
     icon: DollarIcon,
    title: 'Affordable Packages',
    description: 'Transparent per-sq-ft or hourly pricing with no hidden fees. Monthly plans available.',
  },
  {
    icon: LocationIcon,
    title: 'GTA Coverage',
    description: 'Serving Toronto, Scarborough, North York, Etobicoke, Mississauga, Brampton, Vaughan, and Markham.',
  },
  {
    icon: StaffIcon,
    title: 'Discreet, professional staff',
    description: 'Background-checked, uniformed cleaners trained to work quietly without disrupting your space.',
  },
  {
    icon: GuaranteeIcon,
    title: '100% satisfaction guarantee',
    description: 'If anything isn’t right, we’ll return within 24 hours to make it right.',
  },
  {
    icon: leafIcon, 
    title: 'Eco & allergy-safe options',
    description: 'Choose scent-free, eco-certified, or hypoallergenic products tailored to your preferences.',
  },

];


export default function DisplayMessage() {
  return (
    <section  className="features">
      {features.map(({ icon, title, description }) => (
        <div key={title} className="feature-card">
          <img
            src={icon}
            alt={`${title} icon`}
            className="feature-card__icon"
          />
          <h2 className="feature-card__title">
            {title}
          </h2>
          <p id='services' className="feature-card__description">
            {description}
          </p>
        </div>
      ))}
    </section>
  );
}
