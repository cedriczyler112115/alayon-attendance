<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $prov_code
 * @property string $prov_name
 * @property string|null $psgc_prv
 * @property int|null $region_code
 */
class Province extends Model
{
    protected $table = 'lib_provinces';

    protected $primaryKey = 'prov_code';

    public $incrementing = true;

    protected $keyType = 'int';

    public $timestamps = false;

    protected $fillable = [
        'prov_code',
        'prov_name',
        'psgc_prv',
        'region_code',
    ];

    /**
     * Get the cities belonging to this province.
     */
    public function cities(): HasMany
    {
        return $this->hasMany(City::class, 'prov_code', 'prov_code');
    }

    /**
     * Get the attendees in this province.
     */
    public function attendees(): HasMany
    {
        return $this->hasMany(Attendee::class, 'province_id', 'prov_code');
    }
}
