import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SimpleViewProps {
  title: string;
  description: string;
  features: string[];
}

export const SimpleView: React.FC<SimpleViewProps> = ({ title, description, features }) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{description}</p>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default SimpleView;